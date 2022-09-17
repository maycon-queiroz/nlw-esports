import express from 'express'
import cors from 'cors'


import { PrismaClient } from '@prisma/client'
import { convertHourStringToMinutes } from './utils/convert-hour-string-to-minutes'
import { convertMinutesToHourString } from './utils/convert-minutes-to-hour-string'

const app = express()
app.use(express.json())
app.use(cors())

const prisma = new PrismaClient()

app.get('/games', async (request, response) => {
  const games = await prisma.game.findMany({
    include: {
      _count: {
        select: {
          ads: true
        }
      }
    }
  })

  return response.status(200).json(games);
})


app.get('/ads', async (request, response) => {
  const ads = await prisma.ad.findMany();
  return response.status(200).json(ads);
})

app.get('/games/:id/ads', async (request, response) => {
  const gameId = request.params.id;
  const ads = await prisma.ad.findMany({
    select: {
      id: true,
      name: true,
      hourEnd: true,
      hourStart: true,
      useVoiceChannel: true,
      yearsPlaying: true,
      weekDays: true,
      gameId: true,
      CreatedAt: true,
    },
    where: { gameId },
    orderBy: { CreatedAt: 'desc' },
  });

  return response.status(200).json(ads.map(ad => {
    return {
      ...ad,
      weekDays: ad.weekDays.split(','),
      hourStart: convertMinutesToHourString(ad.hourStart),
      hourEnd: convertMinutesToHourString(ad.hourEnd),
    }
  })
  )
})

app.get('/ads/:id/discord', async (request, response) => {
  const adId = request.params.id;

  const ad = await prisma.ad.findUniqueOrThrow({
    select: {
      discord: true,
    },
    where: {
      id: adId
    }
  });

  return response.status(200).json(ad)
})


app.post('/games/:id/ads', async (request, response) => {
  const gameId = request.params.id;
  const body = request.body

  const ad = await prisma.ad.create({
    data: {
      gameId,
      name: body.name,
      hourStart: convertHourStringToMinutes(body.hourStart),
      hourEnd: convertHourStringToMinutes(body.hourEnd),
      weekDays: body.weekDays.join(','),
      discord: body.discord,
      useVoiceChannel: body.useVoiceChannel,
      yearsPlaying: body.yearsPlaying,
    }
  })

  return response.status(201).json(ad);
})

app.listen('3333', () => console.log('listening on http://localhost:3333'))
