import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import ffmpegStatic from 'ffmpeg-static';
import { prisma } from '@/lib/prisma';

const execFileAsync = promisify(execFile);

const isServerless = Boolean(process.env.VERCEL);

async function generateElevenLabsAudio(creativeId: string, scriptText: string, voiceId: string) {
  const cred = await prisma.apiCredential.findUnique({ where: { provider: 'ELEVENLABS' } });
  const apiKey = cred?.apiKey || process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw new Error(
      'ELEVENLABS_API_KEY nao configurada. Salve e teste sua chave da ElevenLabs no Passo 0.'
    );
  }

  const cleanVoiceId = voiceId || '21m00Tcm4TlvDq8ikWAM'; // Rachel (US Native Voice)
  const response = await axios.post(
    `https://api.elevenlabs.io/v1/text-to-speech/${cleanVoiceId}`,
    {
      text: scriptText,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.8,
      },
    },
    {
      headers: {
        'xi-api-key': apiKey.trim(),
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      responseType: 'arraybuffer',
      timeout: 45000,
    }
  );

  const audioBuffer = Buffer.from(response.data);
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
      module: 'ELEVENLABS_TTS',
      action: 'AUDIO_MP3_GENERATED',
      targetId: creativeId,
      httpStatus: response.status,
      detailsJson: JSON.stringify({
        voiceId: cleanVoiceId,
        bytes: response.data.byteLength,
      }),
    },
  });

  return { updated, localDiskPath };
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // MODO 1: JSON request para Geracao de Voz Real na ElevenLabs
    if (contentType.includes('application/json')) {
      const { creativeId, voiceId = '21m00Tcm4TlvDq8ikWAM' } = await req.json();
      if (!creativeId) {
        return NextResponse.json({ error: 'creativeId obrigatorio.' }, { status: 400 });
      }

      const creative = await prisma.creative.findUnique({ where: { id: creativeId } });
      if (!creative) {
        return NextResponse.json({ error: 'Criativo nao encontrado.' }, { status: 404 });
      }

      const fullScript = `${creative.hookEn}. ${creative.bodyEn}. ${creative.ctaEn}`.trim();
      const { updated } = await generateElevenLabsAudio(creative.id, fullScript, voiceId);

      return NextResponse.json({
        creative: updated,
        audioFilePath: updated.audioFilePath,
      });
    }

    // MODO 2: multipart/form-data com Upload Real de .mp4 + Merge com Locucao via FFmpeg
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const creativeId = String(formData.get('creativeId') || '');
      const voiceId = String(formData.get('voiceId') || '21m00Tcm4TlvDq8ikWAM');
      const videoFile = formData.get('video') as File | null;

      if (!creativeId) {
        return NextResponse.json({ error: 'creativeId obrigatorio.' }, { status: 400 });
      }

      let creative = await prisma.creative.findUnique({
        where: { id: creativeId },
        include: { product: true },
      });
      if (!creative) {
        return NextResponse.json({ error: 'Criativo nao encontrado.' }, { status: 404 });
      }

      if (!videoFile) {
        return NextResponse.json(
          { error: 'Envie um arquivo de video .mp4 bruto para renderizar.' },
          { status: 400 }
        );
      }

      const baseRoot = isServerless ? os.tmpdir() : path.join(process.cwd(), 'public');
      const uploadsDir = path.join(baseRoot, 'uploads');
      const videoOutDir = path.join(baseRoot, 'generated', 'video');
      const audioDir = path.join(baseRoot, 'generated', 'audio');

      fs.mkdirSync(uploadsDir, { recursive: true });
      fs.mkdirSync(videoOutDir, { recursive: true });
      fs.mkdirSync(audioDir, { recursive: true });

      const rawVideoPath = path.join(uploadsDir, `${creativeId}_raw.mp4`);
      const arrayBuffer = await videoFile.arrayBuffer();
      fs.writeFileSync(rawVideoPath, Buffer.from(arrayBuffer));

      let localAudioPath = path.join(audioDir, `${creativeId}.mp3`);

      if (!fs.existsSync(localAudioPath)) {
        if (creative.audioFilePath?.startsWith('data:audio/mpeg;base64,')) {
          const b64 = creative.audioFilePath.replace('data:audio/mpeg;base64,', '');
          fs.writeFileSync(localAudioPath, Buffer.from(b64, 'base64'));
        } else {
          const fullScript = `${creative.hookEn}. ${creative.bodyEn}. ${creative.ctaEn}`.trim();
          const resAudio = await generateElevenLabsAudio(creative.id, fullScript, voiceId);
          creative = resAudio.updated;
          localAudioPath = resAudio.localDiskPath;
        }
      }

      const finalVideoFileName = `${creativeId}.mp4`;
      const finalVideoFullPath = path.join(videoOutDir, finalVideoFileName);

      const ffmpegBin = ffmpegStatic || 'ffmpeg';

      await execFileAsync(ffmpegBin, [
        '-y',
        '-i',
        rawVideoPath,
        '-i',
        localAudioPath,
        '-c:v',
        'copy',
        '-c:a',
        'aac',
        '-map',
        '0:v:0',
        '-map',
        '1:a:0',
        '-shortest',
        finalVideoFullPath,
      ]);

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
          module: 'FFMPEG_VIDEO_PIPELINE',
          action: 'VIDEO_MP4_MERGED_WITH_VOICEOVER',
          targetId: creative.id,
          httpStatus: 200,
          detailsJson: JSON.stringify({
            serverless: isServerless,
            videoRendered: true,
          }),
        },
      });

      return NextResponse.json({
        creative: updatedCreative,
        videoFilePath: publicVideoUrl,
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
