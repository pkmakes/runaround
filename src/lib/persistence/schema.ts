import { z } from 'zod'

export const DockSideSchema = z.enum(['top', 'right', 'bottom', 'left'])

export const RoomSchema = z.object({
  width: z.number().min(200),
  height: z.number().min(200),
})

export const RectNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number().min(40),
  height: z.number().min(40),
})

export const PathFieldsSchema = z.object({
  description: z.string(),
  knackpunkt: z.string(),
  begruendung: z.string(),
  kommentar: z.string(),
})

export const PathRowSchema = z.object({
  id: z.string(),
  from: z.object({
    rectId: z.string(),
    side: DockSideSchema,
  }),
  to: z.object({
    rectId: z.string(),
    side: DockSideSchema,
  }),
  points: z.array(z.number()),
  fields: PathFieldsSchema,
  createdAt: z.number(),
})

export const ProjectSchema = z.object({
  version: z.literal(1),
  room: RoomSchema,
  rects: z.array(RectNodeSchema),
  paths: z.array(PathRowSchema),
  pathOrder: z.array(z.string()),
})

export type ProjectData = z.infer<typeof ProjectSchema>

