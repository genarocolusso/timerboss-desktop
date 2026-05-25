# Skytale TimerBoss Desktop ☠

Uma aplicação desktop moderna, leve e premium construída com **Tauri v2**, **React** e **TypeScript** para gerenciar e alertar os horários de nascimentos de chefes (bosses) em tempo real, com overlay flutuante em cima do jogo.

---

## ✨ Funcionalidades Principais

- **Grid de Próximos Eventos**: Visualize todos os bosses do dia organizados cronologicamente a partir do spawn mais próximo.
- **Overlay Customizável (Flutuante)**:
  - **Modos de Orientação**: Alterne entre orientação Horizontal (linha de badges) e Vertical (cartões completos) diretamente no overlay.
  - **Controle de Escala e Opacidade**: Ajuste o tamanho (de 60% a 150%) e a transparência em tempo real para não atrapalhar sua gameplay.
  - **Trava de Posição**: Bloqueie (`🔒`) ou desbloqueie (`🔓`) o arrastar da janela do overlay para fixá-la na melhor parte da sua tela.
  - **Modo Compacto Inteligente**: O overlay oculta automaticamente a barra de controles ao tirar o mouse de cima (`Mouse Leave`), ocupando o menor espaço possível.
- **Alertas por Voz (TTS)**: Notificação nativa em português por voz que avisa quando um boss está para nascer (configurável para 10, 5, 2 minutos antes ou no exato momento do nascimento).
- **Auto-Updater Nativo**: Integrado diretamente com os **Releases do GitHub**. O aplicativo busca novas versões silenciosamente na inicialização e oferece atualizações em um clique.

---

## 🛠 Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Vite, CSS Vanilla (variáveis nativas CSS).
- **Backend / Desktop**: Tauri v2, Rust.
- **Gerenciamento de Estado**: Zustand v5 (com persistência em LocalStorage).
- **Segurança**: Assinatura digital do Tauri com chaves públicas/privadas para atualizações automáticas seguras.

---

## 🚀 Como Iniciar em Desenvolvimento

### Pré-requisitos
Certifique-se de ter instalado em sua máquina:
1. **Node.js** (versão 20 ou superior recomendado)
2. **Rust & Cargo** (via [rustup](https://rustup.rs/))
3. **Dependências do Tauri** para o seu sistema operacional (consulte o [guia oficial do Tauri](https://v2.tauri.app/start/prerequisites/)).

### Passos para Rodar

1. Clone o repositório.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Rode o ambiente de desenvolvimento:
   ```bash
   npm run tauri dev
   ```

---

## 📦 Como Compilar (Build)

Para empacotar a aplicação e gerar o instalador do Windows (`TimerBoss_x64-setup.exe`):

```bash
npm run tauri build
```
*Nota: Certifique-se de que a aplicação em modo desenvolvimento não esteja rodando para evitar erros de bloqueio de escrita de arquivo (`os error 32`).*

---

## 🔄 Sistema de Atualizações Automáticas (Auto-Updater)

O sistema de updates já está configurado no projeto e escuta o repositório `genarocolusso/timerboss-desktop`.

### Como publicar uma nova versão:
1. Altere a versão em `package.json` e `src-tauri/tauri.conf.json` (ex: `1.0.5`).
2. Crie uma tag do git correspondente e envie para o GitHub:
   ```bash
   git tag v1.0.5
   git push origin --tags
   ```
3. A Action do GitHub compilada em `.github/workflows/publish.yml` compilará o instalador automaticamente, assinará digitalmente os arquivos, criará um release público e atualizará o arquivo `latest.json` de controle do Updater.

---

## 📜 Licença

Desenvolvido por **Genaro Colusso** sob a licença MIT. Sinta-se livre para usar, modificar e distribuir.
