# Configurar Login Social (Google / Facebook / Apple)

Este projeto inclui um modal de login com botões "Entrar com Google", "Entrar com Facebook" e "Entrar com Apple". O arquivo `auth.js` contém um exemplo de integração usando Firebase Authentication (SDK compat) — serve como base para implementar o login em um clique.

Passos mínimos para ativar o fluxo real:

1. Crie um projeto no Firebase (https://console.firebase.google.com/).
2. No painel do projeto, habilite Authentication → Sign-in method:
   - Google: ative.
   - Facebook: ative e configure o App ID / App Secret fornecidos pelo Facebook Developers.
   - Apple: ative e siga as instruções do Firebase e do Apple Developer para configurar o serviço.
3. No Firebase Console, copie as credenciais do web app (apiKey, authDomain, projectId, appId) e substitua o objeto `firebaseConfig` em `auth.js`.
4. Para Facebook, configure na sua app do Facebook as URLs de OAuth e adicione o domínio do seu site.
5. Para Apple, será necessário registrar o serviço e configurar identificadores na conta Apple Developer.

Como testar localmente:

- Abra `index.html` em um servidor local (recomendado). Exemplo com Python (pasta do projeto):

```bash
python -m http.server 3000
# abrir http://localhost:3000
```

Notas importantes:
- `auth.js` usa a versão compat do SDK do Firebase incluída via CDN. Em produção, prefira utilizar o SDK modular v9+ com bundler.
- As chaves e IDs do Firebase não devem ser incluídos em repositórios públicos sem proteção adequada.
- Se não quiser usar Firebase, o modal e os botões já existem — você pode ligar os botões aos seus próprios endpoints de OAuth.

Se quiser, eu posso automatizar a configuração adicionando um pequeno servidor Node.js que troca o código OAuth por tokens (ex.: rota `/auth/callback`). Quer que eu implemente isso também?
