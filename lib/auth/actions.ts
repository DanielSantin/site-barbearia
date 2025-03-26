import { BuiltInProviderType } from "next-auth/providers/index";
import {
  LiteralUnion,
  SignInAuthorizationParams,
  SignInOptions,
  SignOutParams,
  signOut,
  signIn as nextAuthSignIn
} from "next-auth/react";

export const signIn = async (
  provider?: LiteralUnion<BuiltInProviderType> | undefined,
  options?: SignInOptions | undefined,
  authorizationParams?: SignInAuthorizationParams | undefined
) => {
  // Configura o redirecionamento para a página de verificação após o login
  const customOptions: SignInOptions = {
    ...options,
    callbackUrl: `${window.location.origin}/auth/verify`
  };
  
  return nextAuthSignIn(provider, customOptions, authorizationParams);
};

export const logOut = async (options?: SignOutParams<true> | undefined) => {
  return signOut(options);
};