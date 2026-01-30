
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkTransaction() {
    const transactionId = 'cmiay3t6q0074ij4rtedmzftb'
    const userId = 'cmiay3s0y0000ij4rdzs3jagl' // The actual owner of the transaction

    const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId }
    })

    console.log('Transaction:', transaction)

    if (transaction) {
        console.log('Transaction User ID:', transaction.userId)
        console.log('Match:', transaction.userId === userId)
    } else {
        console.log('Transaction not found')
    }
}

checkTransaction()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
