# Stock Trading System - Mercato Italiano FTSE MIB

Sistema di trading selettivo e quantitativo per il mercato azionario italiano, focalizzato su analisi statistica, regime detection e gestione del rischio.

## 🎯 Filosofia

**Trading Selettivo**: Opera solo quando c'è un edge statisticamente significativo. La maggior parte del tempo (70%) si rimane in cash.

**Risk Management Perfetto**: Kelly Criterion per position sizing, stop loss rigorosi, rapporto rischio/rendimento minimo 1.3:1.

## 🚀 Funzionalità

### 1. **Analisi Azioni**
- Analisi tecnica avanzata con 20+ indicatori
- Regime Detection Engine (7 regimi di mercato)
- Analisi fondamentale automatizzata
- Supporti, resistenze e pivot points
- Correlazioni con mercati globali
- Eventi finanziari (earnings, dividendi)

### 2. **Opportunity Scanner**
- Scansione automatica di 30 titoli FTSE MIB
- Algoritmi di edge detection:
  - Volume anomaly (spike statisticamente significativi)
  - Post-earnings drift (momentum post-annunci)
  - Pre-dividend accumulation (pattern pre-dividendo)
- Validazione statistica (z-score, p-value)
- Kelly Criterion per position sizing
- Filtri rigorosi: confidence >60%, R:R >1.3, expected return >0.8%
- Scoring composito 0-100 per ranking

### 3. **Backtesting**
- Test su dati storici (fino a 5 anni)
- Metriche complete: win rate, profit factor, max drawdown
- Validazione out-of-sample
- Analisi trade-by-trade
- Performance rating

### 4. **Impostazioni**
- Tema chiaro/scuro
- Opzioni avanzate
- Reset dati

## 📊 Titoli Supportati

30 titoli FTSE MIB tra cui:
- A2A, Amplifon, Azimut, Banco BPM
- Enel, ENI, Ferrari, FinecoBank
- Generali, Intesa Sanpaolo, Leonardo
- Poste Italiane, Prysmian, STMicroelectronics
- Telecom Italia, Tenaris, Terna, UniCredit
- E molti altri...

## 🛠️ Tecnologie

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Charts**: Recharts
- **API**: Yahoo Finance (free tier)
- **State Management**: React Query

## 🏃 Avvio Rapido

```bash
# Clona il repository
git clone https://github.com/fili77/stock-scanner-italia.git

# Entra nella cartella
cd stock-scanner-italia

# Installa dipendenze
npm install

# Avvia in modalità sviluppo
npm run dev

# Build per produzione
npm run build
```

## 📝 Utilizzo

1. **Homepage**: Scegli tra Analisi Azioni, Opportunity Scanner, Backtesting
2. **Analisi Azioni**: Inserisci ticker (es. ISP.MI, UCG.MI, ENI.MI) e ottieni analisi completa
3. **Opportunity Scanner**: Clicca "Avvia Scansione" per cercare opportunità nei 30 titoli FTSE MIB
4. **Backtesting**: Seleziona titolo e periodo per validare strategie

## ⚠️ Disclaimer

Questo software è fornito a scopo puramente educativo e di ricerca. Non costituisce consulenza finanziaria.

Trading di azioni comporta rischi significativi. Non investire denaro che non puoi permetterti di perdere.

Le performance passate non sono indicative di risultati futuri.

## 📄 Licenza

MIT License - Vedi LICENSE per dettagli

## 🤝 Contributi

Contributi, issues e feature requests sono benvenuti!

## 📧 Contatti

Per domande o supporto, apri una issue su GitHub.

---

**Sviluppato con ❤️ per trader quantitativi italiani**
