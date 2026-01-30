import prisma from './prisma'

const defaultCategories = [
  // Despesas
  { name: 'Alimentação', type: 'EXPENSE', subcategories: ['Restaurante', 'Supermercado', 'Lanche'] },
  { name: 'Transporte', type: 'EXPENSE', subcategories: ['Combustível', 'Ônibus', 'Uber/Táxi'] },
  { name: 'Moradia', type: 'EXPENSE', subcategories: ['Aluguel', 'Contas', 'Manutenção'] },
  { name: 'Saúde', type: 'EXPENSE', subcategories: ['Farmácia', 'Consultas', 'Academia'] },
  { name: 'Educação', type: 'EXPENSE', subcategories: ['Livros', 'Cursos', 'Material Escolar'] },
  { name: 'Lazer', type: 'EXPENSE', subcategories: ['Cinema', 'Entretenimento', 'Hobbies'] },
  { name: 'Outras Despesas', type: 'EXPENSE', subcategories: ['Diversos'] }
]

export async function createDefaultCategories(userId: string) {
  // Verificar se já tem categorias
  const existingCategories = await prisma.category.findFirst({
    where: { userId }
  })

  if (existingCategories) {
    console.log(`Usuário ${userId} já possui categorias, pulando criação.`)
    return // Usuário já tem categorias
  }

  console.log(`Criando categorias padrão para o usuário ${userId}...`)

  // Criar categorias padrão
  for (const cat of defaultCategories) {
    const category = await prisma.category.create({
      data: {
        name: cat.name,
        type: cat.type, // Adicionado o tipo
        userId: userId
      }
    })

    // Criar subcategorias, se existirem
    if (cat.subcategories && cat.subcategories.length > 0) {
      for (const subName of cat.subcategories) {
        await prisma.subcategory.create({
          data: {
            name: subName,
            categoryId: category.id
          }
        })
      }
    }
  }
  console.log(`Categorias padrão para o usuário ${userId} criadas com sucesso.`)
}
