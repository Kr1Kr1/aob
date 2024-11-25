# aob

This repository includes:

Chrome Extension: Tracks game history and stats from Age of Olympia.
NestJS Backend: Serves as an API and local database to store and analyze game data.

Prerequisites
- Node.js (v16 or higher)
- npm or yarn (package manager)
- Chrome Browser (for the extension)

## Chrome extension

Type chrome://extensions in the url bar and press enter.
Enable the developer mode on top right corner
And click on "charger l'extension non empaquetée", provide the path of the extension folder

## Nest dashboard & backend

```console
cd aoo-tracker
npm install
npx prisma migrate dev
pnpm dev
```
