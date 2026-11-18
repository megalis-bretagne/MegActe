type pastellUserInfo = {
  id_u: number;
  login: string;
  nom: string;
  prenom: string;
  email: string;
  id_e: number;
};

export type EntiteNode = {
  id_e: number;
  denomination: string;
  child: EntiteNode[];
};

export type pastellUser = {
  user_info: pastellUserInfo;
  entites: EntiteNode[];
};
