import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import ffmpegStatic from 'ffmpeg-static';
import { prisma, ensureSqliteTables } from '@/lib/prisma';
import { ensureCreativeFromVault } from '@/lib/server-vault';
import { generateEnglishVoiceoverMp3 } from '@/lib/free-tts';
import {
  generateCreativeAiVideoMp4,
  AiVideoStyle,
  resolveUsableFfmpegBin,
} from '@/lib/free-video';

export const maxDuration = 60;

const execFileAsync = promisify(execFile);
const isServerless = Boolean(process.env.VERCEL);

async function synthesizeAndSaveAudio(
  creativeId: string,
  scriptText: string,
  voiceId: string,
  vaultCredentials?: any
) {
  const ffmpegBin = ffmpegStatic || 'ffmpeg';
  const ttsResult = await generateEnglishVoiceoverMp3({
    scriptText,
    voiceId,
    vaultCredentials,
    ffmpegBin,
  });

  const audioBuffer = ttsResult.audioBuffer;
  const fileName = `${creativeId}.mp3`;

  let publicUrlPath = '';
  let localDiskPath = '';

  if (isServerless) {
    const tmpAudioDir = path.join(os.tmpdir(), 'generated', 'audio');
    fs.mkdirSync(tmpAudioDir, { recursive: true });
    localDiskPath = path.join(tmpAudioDir, fileName);
    fs.writeFileSync(localDiskPath, audioBuffer);
    publicUrlPath = `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`;
  } else {
    const audioDir = path.join(process.cwd(), 'public', 'generated', 'audio');
    fs.mkdirSync(audioDir, { recursive: true });
    localDiskPath = path.join(audioDir, fileName);
    fs.writeFileSync(localDiskPath, audioBuffer);
    publicUrlPath = `/generated/audio/${fileName}`;
  }

  const updated = await prisma.creative.update({
    where: { id: creativeId },
    data: {
      audioFilePath: publicUrlPath,
      status: 'AUDIO_GENERATED',
    },
    include: { product: true },
  });

  await prisma.automationLog.create({
    data: {
      module: 'VOICEOVER_TTS',
      action: 'AUDIO_MP3_GENERATED',
      targetId: creativeId,
      httpStatus: ttsResult.httpStatus,
      detailsJson: JSON.stringify({
        voiceId,
        ttsEngineUsed: ttsResult.ttsEngineUsed,
        bytes: audioBuffer.byteLength,
      }),
    },
  });

  return {
    updated,
    localDiskPath,
    ttsEngineUsed: ttsResult.ttsEngineUsed,
    fallbackNotice: ttsResult.fallbackNotice,
  };
}

export async function POST(req: NextRequest) {
  try {
    await ensureSqliteTables();
    const contentType = req.headers.get('content-type') || '';

    // MODO 1: JSON request para Geracao de Voz (ElevenLabs se paga OU Voz Neural Americana Grátis $0.00)
    if (contentType.includes('application/json')) {
      const {
        creativeId,
        voiceId = 'cgSgspJ2msm6clMCkdW9',
        _vaultCredentials,
        _vaultCreative,
        _vaultProduct,
      } = await req.json();
      if (!creativeId) {
        return NextResponse.json({ error: 'creativeId obrigatorio.' }, { status: 400 });
      }

      const creative = await ensureCreativeFromVault(
        creativeId,
        _vaultCreative,
        _vaultProduct
      );
      if (!creative) {
        return NextResponse.json({ error: 'Criativo nao encontrado.' }, { status: 404 });
      }

      const fullScript = `${creative.hookEn}. ${creative.bodyEn}. ${creative.ctaEn}`.trim();
      const { updated, ttsEngineUsed, fallbackNotice } = await synthesizeAndSaveAudio(
        creative.id,
        fullScript,
        voiceId,
        _vaultCredentials
      );

      return NextResponse.json({
        creative: updated,
        audioFilePath: updated.audioFilePath,
        ttsEngineUsed,
        fallbackNotice,
      });
    }

    // MODO 2: multipart/form-data com Upload Real de .mp4 (ou canvas 9:16 gratuito) + Merge via FFmpeg
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const creativeId = String(formData.get('creativeId') || '');
      const voiceId = String(formData.get('voiceId') || 'cgSgspJ2msm6clMCkdW9');
      const rawStyle = String(formData.get('videoStyle') || 'AI_SCENES');
      const videoStyle: AiVideoStyle =
        rawStyle === 'KINETIC_CARDS' ? 'KINETIC_CARDS' : 'AI_SCENES';
      const videoFile = formData.get('video') as File | null;

      let vaultCredentials: any = undefined;
      let vaultCreative: any = undefined;
      let vaultProduct: any = undefined;
      try {
        const rawCreds = formData.get('_vaultCredentials');
        if (typeof rawCreds === 'string' && rawCreds) vaultCredentials = JSON.parse(rawCreds);
        const rawCreative = formData.get('_vaultCreative');
        if (typeof rawCreative === 'string' && rawCreative) vaultCreative = JSON.parse(rawCreative);
        const rawProduct = formData.get('_vaultProduct');
        if (typeof rawProduct === 'string' && rawProduct) vaultProduct = JSON.parse(rawProduct);
      } catch {
        // Ignora parse invalido
      }

      if (!creativeId) {
        return NextResponse.json({ error: 'creativeId obrigatorio.' }, { status: 400 });
      }

      let creative = await ensureCreativeFromVault(creativeId, vaultCreative, vaultProduct);
      if (!creative) {
        return NextResponse.json({ error: 'Criativo nao encontrado.' }, { status: 404 });
      }

      const baseRoot = isServerless ? os.tmpdir() : path.join(process.cwd(), 'public');
      const uploadsDir = path.join(baseRoot, 'uploads');
      const videoOutDir = path.join(baseRoot, 'generated', 'video');
      const audioDir = path.join(baseRoot, 'generated', 'audio');

      fs.mkdirSync(uploadsDir, { recursive: true });
      fs.mkdirSync(videoOutDir, { recursive: true });
      fs.mkdirSync(audioDir, { recursive: true });

      let localAudioPath = path.join(audioDir, `${creativeId}.mp3`);
      let ttsEngineUsed = 'Áudio salvo no projeto';
      let fallbackNotice: string | undefined;

      if (!fs.existsSync(localAudioPath)) {
        if (creative.audioFilePath?.startsWith('data:audio/mpeg;base64,')) {
          const b64 = creative.audioFilePath.replace('data:audio/mpeg;base64,', '');
          fs.writeFileSync(localAudioPath, Buffer.from(b64, 'base64'));
        } else {
          const fullScript = `${creative.hookEn}. ${creative.bodyEn}. ${creative.ctaEn}`.trim();
          const resAudio = await synthesizeAndSaveAudio(
            creative.id,
            fullScript,
            voiceId,
            vaultCredentials
          );
          creative = resAudio.updated;
          localAudioPath = resAudio.localDiskPath;
          ttsEngineUsed = resAudio.ttsEngineUsed;
          fallbackNotice = resAudio.fallbackNotice;
        }
      }

      const finalVideoFileName = `${creativeId}.mp4`;
      const finalVideoFullPath = path.join(videoOutDir, finalVideoFileName);
      const ffmpegBin = resolveUsableFfmpegBin(ffmpegStatic);
      let videoEngineUsed = 'Estúdio IA Criativo (4 Cenas + Legendas + Soundwave)';
      let requiresClientRender = false;
      let clientRenderData:
        | {
            scenePngDataUris?: string[];
            sceneDurationsSec?: number[];
            audioDataUri: string;
          }
        | undefined;

      const audioBufferForClient = fs.readFileSync(localAudioPath);
      const audioDataUri = `data:audio/mpeg;base64,${audioBufferForClient.toString('base64')}`;

      if (videoFile && videoFile.size > 0) {
        if (ffmpegBin) {
          try {
            const rawVideoPath = path.join(uploadsDir, `${creativeId}_raw.mp4`);
            const arrayBuffer = await videoFile.arrayBuffer();
            fs.writeFileSync(rawVideoPath, Buffer.from(arrayBuffer));

            await execFileAsync(ffmpegBin, [
              '-y',
              '-stream_loop',
              '-1',
              '-i',
              rawVideoPath,
              '-i',
              localAudioPath,
              '-c:v',
              'copy',
              '-c:a',
              'aac',
              '-b:a',
              '192k',
              '-map',
              '0:v:0',
              '-map',
              '1:a:0',
              '-shortest',
              '-movflags',
              '+faststart',
              finalVideoFullPath,
            ]);
            videoEngineUsed = 'Vídeo de Fundo Enviado + Locução Nativa';
          } catch {
            requiresClientRender = true;
            clientRenderData = { audioDataUri };
            videoEngineUsed = 'Vídeo de Fundo Enviado + Locução Nativa (Web Studio)';
          }
        } else {
          requiresClientRender = true;
          clientRenderData = { audioDataUri };
          videoEngineUsed = 'Vídeo de Fundo Enviado + Locução Nativa (Web Studio)';
        }
      } else {
        const aiVideoResult = await generateCreativeAiVideoMp4({
          creative,
          localAudioPath,
          outputVideoPath: finalVideoFullPath,
          videoStyle,
          ffmpegBin,
        });
        videoEngineUsed = aiVideoResult.videoEngineUsed;

        if (!aiVideoResult.renderedOnServer && aiVideoResult.clientRenderData) {
          requiresClientRender = true;
          clientRenderData = {
            scenePngDataUris: aiVideoResult.clientRenderData.scenePngDataUris,
            sceneDurationsSec: aiVideoResult.clientRenderData.sceneDurationsSec,
            audioDataUri,
          };
        }
      }

      if (requiresClientRender && clientRenderData) {
        const updatedCreative = await prisma.creative.update({
          where: { id: creative.id },
          data: {
            audioFilePath: audioDataUri,
            status: 'VIDEO_RENDERED',
          },
          include: { product: true },
        });

        await prisma.automationLog.create({
          data: {
            module: 'AI_VIDEO_GENERATOR',
            action: 'CREATIVE_SCENES_PREPARED_FOR_WEB_RENDER',
            targetId: creative.id,
            httpStatus: 200,
            detailsJson: JSON.stringify({
              serverless: isServerless,
              videoStyle: videoFile && videoFile.size > 0 ? 'CUSTOM_UPLOAD' : videoStyle,
              videoEngineUsed,
              ttsEngineUsed,
            }),
          },
        });

        return NextResponse.json({
          creative: updatedCreative,
          requiresClientRender: true,
          clientRenderData,
          videoEngineUsed,
          ttsEngineUsed,
          fallbackNotice,
        });
      }

      let publicVideoUrl = `/generated/video/${finalVideoFileName}`;
      if (isServerless) {
        const finalVideoBuffer = fs.readFileSync(finalVideoFullPath);
        publicVideoUrl = `data:video/mp4;base64,${finalVideoBuffer.toString('base64')}`;
      }

      const updatedCreative = await prisma.creative.update({
        where: { id: creative.id },
        data: {
          videoFilePath: publicVideoUrl,
          status: 'VIDEO_RENDERED',
        },
        include: { product: true },
      });

      await prisma.automationLog.create({
        data: {
          module: 'AI_VIDEO_GENERATOR',
          action: 'CREATIVE_VIDEO_MP4_GENERATED',
          targetId: creative.id,
          httpStatus: 200,
          detailsJson: JSON.stringify({
            serverless: isServerless,
            videoStyle: videoFile && videoFile.size > 0 ? 'CUSTOM_UPLOAD' : videoStyle,
            videoEngineUsed,
            ttsEngineUsed,
          }),
        },
      });

      return NextResponse.json({
        creative: updatedCreative,
        videoFilePath: publicVideoUrl,
        videoEngineUsed,
        ttsEngineUsed,
        fallbackNotice,
      });
    }

    return NextResponse.json({ error: 'Content-Type nao suportado.' }, { status: 400 });
  } catch (error: any) {
    const errMsg =
      error?.response?.data
        ? Buffer.isBuffer(error.response.data)
          ? error.response.data.toString('utf-8')
          : JSON.stringify(error.response.data)
        : error.message || 'Erro no pipeline de audio/video';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
