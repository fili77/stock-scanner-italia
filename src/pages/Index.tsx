
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings, TrendingUp, Search, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/Header';

const Index = () => {
  const menuItems = [
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: 'Analisi Azioni',
      description: 'Analizza e prevedi titoli azionari italiani con indicatori tecnici avanzati',
      to: '/stock-prediction',
      color: 'bg-emerald-600',
    },
    {
      icon: <Search className="h-6 w-6" />,
      title: 'Opportunity Scanner',
      description: 'Scansiona 30 titoli FTSE MIB per opportunità con edge statistico',
      to: '/opportunity-scanner',
      color: 'bg-yellow-600',
    },
    {
      icon: <Activity className="h-6 w-6" />,
      title: 'Backtesting',
      description: 'Testa strategie su dati storici per validazione statistica',
      to: '/backtesting',
      color: 'bg-blue-600',
    },
    {
      icon: <Settings className="h-6 w-6" />,
      title: 'Impostazioni',
      description: 'Configura l\'applicazione',
      to: '/settings',
      color: 'bg-orange-600',
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 container max-w-4xl px-4 py-8">
        <motion.h1
          className="text-3xl font-extrabold text-center mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Stock Trading System
        </motion.h1>

        <motion.p
          className="text-center text-muted-foreground mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Sistema di trading selettivo per il mercato italiano FTSE MIB
        </motion.p>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {menuItems.map((menuItem, index) => (
            <MenuItem key={index} {...menuItem} variants={item} />
          ))}
        </motion.div>
      </main>
    </div>
  );
};

const MenuItem = ({ icon, title, description, to, color, variants }) => (
  <motion.div variants={variants}>
    <Link to={to}>
      <Card className="h-full hover:bg-accent transition-colors duration-300">
        <CardContent className="p-6 flex items-center space-x-4">
          <div className={`p-3 rounded-full ${color} text-white`}>
            {icon}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  </motion.div>
);

export default Index;
