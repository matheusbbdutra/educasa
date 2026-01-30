import { createPrismaClient } from './prisma-client.js'

const prisma = createPrismaClient()

/**
 * Categorias e subcategorias baseadas no IPCA
 * 
 * Este script adiciona as categorias IPCA globais ao banco de dados.
 * As categorias são marcadas como isSystem: true e são compartilhadas entre todos os usuários.
 */

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

async function seedIPCACategories() {
  console.log('🌱 Iniciando seed de categorias IPCA...\n')

  let totalCategories = 0
  let totalSubcategories = 0
  let skippedCategories = 0

  for (const categoryData of ipcaCategories) {
    // Verificar se a categoria já existe
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: categoryData.name,
        type: 'EXPENSE'
      }
    })

    let category
    if (existingCategory) {
      console.log(`⏭️  Categoria '${categoryData.name}' já existe, pulando...`)
      category = existingCategory
      skippedCategories++
    } else {
      category = await prisma.category.create({
        data: {
          name: categoryData.name,
          type: 'EXPENSE',
          isSystem: true
        }
      })
      totalCategories++
      console.log(`✅ Categoria criada: ${category.name}`)
    }

    // Adicionar subcategorias
    for (const subcategoryName of categoryData.subcategories) {
      // Verificar se a subcategoria já existe
      const existingSubcategory = await prisma.subcategory.findFirst({
        where: {
          name: subcategoryName,
          categoryId: category.id
        }
      })

      if (existingSubcategory) {
        console.log(`   ⏭️  Subcategoria '${subcategoryName}' já existe`)
      } else {
        await prisma.subcategory.create({
          data: {
            name: subcategoryName,
            categoryId: category.id,
            isSystem: true
          }
        })
        totalSubcategories++
        console.log(`   ✅ Subcategoria criada: ${subcategoryName}`)
      }
    }
    console.log('')
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ Seed de categorias IPCA concluído!')
  console.log(`📊 ${totalCategories} categorias criadas`)
  console.log(`📋 ${totalSubcategories} subcategorias criadas`)
  if (skippedCategories > 0) {
    console.log(`⏭️  ${skippedCategories} categorias já existiam`)
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

// Executar
seedIPCACategories()
  .catch((error) => {
    console.error('❌ Erro ao executar seed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
