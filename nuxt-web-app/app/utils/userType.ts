type User = {
  name: string
  email: string
  image: string
}

type pastellUserInfo = {
  id_u: number
  login: string
  nom: string
  prenom: string
  email: string
  id_e: number
}

type pastellUser = {
  userinfo: pastellUserInfo
  entites: [[object]]
}

export type userSession = {
  user: User
  pastellUser: pastellUser
}
