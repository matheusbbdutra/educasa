/**
 * Cliente para comunicação com o Go Worker Service
 *
 * O Go Worker processa operações bloqueantes como:
 * - Geração de CSVs
 * - Envio de emails em massa
 * - Exportações mensais automáticas
 */

const GO_WORKER_URL = process.env.GO_WORKER_URL || 'http://localhost:8080'
const GO_WORKER_API_KEY = process.env.GO_WORKER_API_KEY || ''

export interface GoWorkerJobPayload {
  user_ids?: string[]
  turma_name?: string
  start_date: string // ISO 8601
  end_date: string   // ISO 8601
  to_email: string
  batch_size?: number
  export_record_id?: string
  subject?: string
}

export interface EnqueueJobOptions {
  type: 'MANUAL' | 'MONTHLY_AUTO'
  priority?: number
  payload: GoWorkerJobPayload
}

export interface EnqueueJobResponse {
  job_id: string
  status: string
}

/**
 * Enfileira um novo job no Go Worker
 *
 * @param options Opções do job (tipo, prioridade, payload)
 * @returns ID do job enfileirado
 * @throws Error se a comunicação com o worker falhar
 */
export async function enqueueGoWorkerJob(
  options: EnqueueJobOptions
): Promise<string> {
  const response = await fetch(`${GO_WORKER_URL}/api/v1/jobs/enqueue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': GO_WORKER_API_KEY
    },
    body: JSON.stringify(options)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Go worker error (${response.status}): ${errorText}`)
  }

  const data: EnqueueJobResponse = await response.json()
  return data.job_id
}

/**
 * Consulta o status de um job específico
 *
 * @param jobId ID do job
 * @returns Status e detalhes do job
 */
export async function getJobStatus(jobId: string) {
  const response = await fetch(`${GO_WORKER_URL}/api/v1/jobs/${jobId}/status`, {
    headers: {
      'X-API-Key': GO_WORKER_API_KEY
    }
  })

  if (!response.ok) {
    throw new Error(`Go worker error: ${response.status}`)
  }

  return response.json()
}

/**
 * Lista jobs na fila do Go Worker
 *
 * @param status Filtro por status (opcional)
 * @returns Lista de jobs e resumo
 */
export async function getJobQueue(status?: string) {
  const url = new URL(`${GO_WORKER_URL}/api/v1/jobs/queue`)
  if (status) {
    url.searchParams.set('status', status)
  }

  const response = await fetch(url.toString(), {
    headers: {
      'X-API-Key': GO_WORKER_API_KEY
    }
  })

  if (!response.ok) {
    throw new Error(`Go worker error: ${response.status}`)
  }

  return response.json()
}

/**
 * Verifica saúde do Go Worker
 *
 * @returns Status de saúde do serviço
 */
export async function checkWorkerHealth() {
  try {
    const response = await fetch(`${GO_WORKER_URL}/api/v1/health`, {
      headers: {
        'X-API-Key': GO_WORKER_API_KEY
      }
    })

    if (!response.ok) {
      return { healthy: false, error: response.status }
    }

    return await response.json()
  } catch (error: any) {
    return { healthy: false, error: error.message }
  }
}
