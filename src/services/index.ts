export type { User } from './types'

export { default as authServices } from './auth'

import authServices from './auth'

export const services = {
  auth: authServices,
}

export default services
