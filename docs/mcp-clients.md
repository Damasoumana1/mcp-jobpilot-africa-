# Connecter JobPilot Africa a des clients LLM

## Claude Desktop

Ajoutez `configs/claude_desktop_config.json` au dossier de configuration Claude Desktop.
La valeur `cwd` doit pointer vers la racine du projet.

## Cursor

Cursor accepte les serveurs MCP stdio dans sa configuration utilisateur ou un fichier
`.cursor/mcp.json`. Utilisez la meme commande Python et les memes arguments que Claude Desktop.

## VS Code / Copilot

Placez `configs/vscode-mcp.json` sous `.vscode/mcp.json`, puis redemarrez VS Code.
Le serveur sera visible dans le panneau des outils MCP de Copilot.

## ChatGPT et autres clients distants

ChatGPT ne peut pas se connecter directement a une instance stdio locale. Publiez le serveur
HTTP/MCP derriere HTTPS :

```bash
python -m jobpilot.server --transport http --host 0.0.0.0 --port 8000 --bearer-token "secret-long"
```

Ajoutez ensuite l'URL publique du serveur comme connecteur MCP distant dans le client
compatible. Les appels HTTP doivent envoyer :

```http
Authorization: Bearer secret-long
```

Pour autoriser une interface web a appeler le serveur depuis un autre domaine :

```bash
python -m jobpilot.server --transport http --host 127.0.0.1 --port 8000 --cors-origin http://localhost:5173
```

N'exposez jamais un serveur HTTP sans HTTPS et un jeton Bearer sur Internet.
