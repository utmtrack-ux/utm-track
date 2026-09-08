import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { authLimiter } from '@/lib/rate-limit'

const registerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
})

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous'
    const rate = await authLimiter.check(`register_${ip}`, 10)
    if (!rate.success) {
      return NextResponse.json(
        { message: 'Muitas tentativas de cadastro. Tente novamente em instantes.' },
        { status: 429, headers: { 'Retry-After': String(rate.reset) } }
      )
    }

    const body = await req.json()
    const { name, email, password } = registerSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'E-mail já cadastrado' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      }
    })

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).substring(2, 7)}`
    
    await prisma.workspace.create({
      data: {
        name: `${name}'s Workspace`,
        slug,
        members: {
          create: {
            userId: user.id,
            role: 'owner',
          }
        }
      }
    })

    return NextResponse.json(
      { message: 'Conta criada com sucesso' },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0]?.message || 'Dados inválidos' }, { status: 400 })
    }

    // Surface the real cause in the server logs (visible in `vercel logs` / the
    // Runtime Logs tab). Never returned to the client.
    console.error('[auth/register] falha ao criar conta:', error)

    const code = (error as { code?: string })?.code
    // Prisma unique-constraint: e-mail (or slug) já existe
    if (code === 'P2002') {
      return NextResponse.json({ message: 'E-mail já cadastrado' }, { status: 409 })
    }
    // P1000/P1001/P1002 = sem conexão com o banco · P2021/P2022 = tabela/coluna ausente
    if (code && /^P(1\d{3}|2021|2022)$/.test(code)) {
      return NextResponse.json(
        { message: 'Serviço de banco de dados indisponível. Verifique a configuração de DATABASE_URL e se o schema foi aplicado.' },
        { status: 503 }
      )
    }

    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 })
  }
}
