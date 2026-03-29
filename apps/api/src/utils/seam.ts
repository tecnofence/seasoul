import { Seam } from 'seam'

let _seam: Seam | null = null

function getSeam(): Seam {
  if (!_seam) {
    _seam = new Seam({ apiKey: process.env.SEAM_API_KEY! })
  }
  return _seam
}

/**
 * Cria um código de acesso temporário numa fechadura TTLock via Seam API
 * Retorna o access_code_id para posterior revogação
 */
export async function createLockPin(
  deviceId: string,
  pin: string,
  startsAt: Date,
  endsAt: Date,
  name: string
): Promise<string> {
  const seam = getSeam()
  const accessCode = await seam.accessCodes.create({
    device_id: deviceId,
    code: pin,
    name,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
  })
  return accessCode.access_code_id
}

/**
 * Revoga um código de acesso numa fechadura TTLock via Seam API
 */
export async function deleteLockPin(
  deviceId: string,
  accessCodeId: string
): Promise<void> {
  const seam = getSeam()
  await seam.accessCodes.delete({
    device_id: deviceId,
    access_code_id: accessCodeId,
  })
}
