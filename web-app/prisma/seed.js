import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

// Categorias e subcategorias baseadas no IPCA
const ipcaCategories = [
  {
    name: 'Alimentação e bebidas',
    subcategories: [
      'Arroz', 'Feijão', 'Macarrão', 'Farinha / cuscuz / outros cereais',
      'Carnes bovinas', 'Frango', 'Ovos', 'Leite', 'Queijo e derivados',
      'Pães', 'Café', 'Açúcar e doces', 'Óleo / gordura', 'Frutas',
      'Verduras e legumes', 'Bebidas não alcoólicas (refrigerante, suco, etc.)',
      'Bebidas alcoólicas', 'Refeições prontas fora de casa', 'Lanches fora de casa'
    ]
  },
  {
    name: 'Habitação',
    subcategories: [
      'Aluguel', 'Condomínio', 'Energia elétrica', 'Água e esgoto',
      'Gás de cozinha', 'Taxa de lixo / condomínio extra', 'Material de limpeza',
      'Serviços de limpeza / diarista', 'Pequenos reparos (encanador, eletricista, etc.)',
      'Seguro residencial / IPTU (se quiser usar)'
    ]
  },
  {
    name: 'Artigos de residência',
    subcategories: [
      'Móveis (cama, guarda-roupa, mesa, etc.)',
      'Eletrodomésticos (geladeira, fogão, micro-ondas, etc.)',
      'Eletrônicos (TV, som, computador simples)',
      'Ventilador / ar-condicionado',
      'Utensílios domésticos (panelas, talheres, copos, etc.)',
      'Enxoval (lençol, toalhas, cortinas)',
      'Serviços de montagem e reparo de móveis / eletros'
    ]
  },
  {
    name: 'Vestuário',
    subcategories: [
      'Roupas (camisa, calça, vestido, etc.)',
      'Roupas íntimas',
      'Roupas infantis',
      'Calçados',
      'Acessórios (cinto, bolsa, boné, etc.)',
      'Ajustes e consertos de roupas'
    ]
  },
  {
    name: 'Transportes',
    subcategories: [
      'Passagem de ônibus urbano',
      'Transporte por aplicativo / táxi',
      'Combustível (gasolina, etanol, diesel)',
      'Estacionamento / pedágio',
      'Manutenção do veículo (revisão, pneus, óleo, etc.)',
      'Seguro do veículo / IPVA',
      'Transporte escolar'
    ]
  },
  {
    name: 'Saúde e cuidados pessoais',
    subcategories: [
      'Plano de saúde',
      'Consultas médicas',
      'Exames',
      'Medicamentos',
      'Óculos / lentes',
      'Tratamentos odontológicos',
      'Higiene pessoal (sabonete, shampoo, pasta de dente, etc.)',
      'Produtos femininos (absorvente, etc.)',
      'Fraldas (infantis e geriátricas)',
      'Cuidados estéticos básicos (cremes, protetor solar, etc.)'
    ]
  },
  {
    name: 'Despesas pessoais',
    subcategories: [
      'Cabeleireiro / barbearia',
      'Manicure / pedicure / estética',
      'Academia / esporte',
      'Lazer (cinema, shows, passeios)',
      'Gastos com pets (ração, veterinário, banho e tosa)',
      'Tarifas bancárias',
      'Presentes / doações',
      'Hotéis / viagens'
    ]
  },
  {
    name: 'Educação',
    subcategories: [
      'Mensalidade escolar (fundamental / médio)',
      'Mensalidade ensino superior',
      'Mensalidade creche / educação infantil',
      'Cursos livres (idiomas, informática, etc.)',
      'Material escolar',
      'Livros / revistas educacionais'
    ]
  },
  {
    name: 'Comunicação',
    subcategories: [
      'Internet banda larga',
      'Plano de celular (pós / pré-pago)',
      'Telefone fixo',
      'TV por assinatura / streaming'
    ]
  }
]

async function main() {
  console.log('🌱 Starting seed...')

  // Limpar dados existentes
  console.log('🗑️  Cleaning existing data...')
  await prisma.transaction.deleteMany({})
  await prisma.subcategory.deleteMany({})
  await prisma.category.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.turma.deleteMany({})

  // Criar usuário admin
  console.log('👤 Creating admin user...')
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@educasa.com',
      password: hashedPassword,
      name: 'Administrador',
      role: 'ADMIN'
    }
  })
  console.log(`✅ Admin created: ${admin.email}`)

  // Criar categorias e subcategorias IPCA
  console.log('📊 Creating IPCA categories and subcategories...')

  let totalCategories = 0
  let totalSubcategories = 0

  for (const categoryData of ipcaCategories) {
    const category = await prisma.category.create({
      data: {
        name: categoryData.name,
        type: 'EXPENSE',
        isSystem: true
      }
    })
    totalCategories++
    console.log(`  📁 Category: ${category.name}`)

    for (const subcategoryName of categoryData.subcategories) {
      await prisma.subcategory.create({
        data: {
          name: subcategoryName,
          categoryId: category.id,
          isSystem: true
        }
      })
      totalSubcategories++
    }
  }

  console.log(`\n✅ Seed completed successfully!`)
  console.log(`   📊 ${totalCategories} categories created`)
  console.log(`   📋 ${totalSubcategories} subcategories created`)
  console.log(`   👤 1 admin user created`)
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
