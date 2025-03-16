
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Scan, Settings, FileSpreadsheet, ImagePlus, UserPlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/Header';
import SignatureSheetSelector from '@/components/SignatureSheetSelector';

const Index = () => {
  const menuItems = [
    {
      icon: <Scan className="h-6 w-6" />,
      title: 'Scansiona Presenza',
      description: 'Registra presenze con scansione di codici individuali',
      to: '/scan',
      color: 'bg-primary',
    },
    {
      icon: <ImagePlus className="h-6 w-6" />,
      title: 'Scansione Multipla',
      description: 'Carica una foto del foglio presenze',
      to: '/batch-scan',
      color: 'bg-green-600',
    },
    {
      icon: <UserPlus className="h-6 w-6" />,
      title: 'Presenza Manuale',
      description: 'Inserisci manualmente presenze e genera fogli firma',
      to: '/manual-attendance',
      color: 'bg-purple-600',
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: 'Corsi',
      description: 'Gestisci e visualizza i corsi',
      to: '/courses',
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

  const [showSignatureSheet, setShowSignatureSheet] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 container max-w-4xl px-4 py-8">
        <motion.h1 
          className="text-3xl font-extrabold text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Gestione Presenze
        </motion.h1>
        
        {!showSignatureSheet ? (
          <>
            <div className="mb-8">
              <Card className="hover:bg-accent transition-colors duration-300 cursor-pointer" onClick={() => setShowSignatureSheet(true)}>
                <CardContent className="p-6 flex items-center space-x-4">
                  <div className="p-3 rounded-full bg-amber-600 text-white">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Stampa Foglio Firme</h2>
                    <p className="text-sm text-muted-foreground">Genera e stampa un foglio firme per un corso</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {menuItems.map((item, index) => (
                <MenuItem key={index} {...item} variants={item} />
              ))}
            </motion.div>
          </>
        ) : (
          <div>
            <button 
              className="mb-6 text-sm flex items-center hover:underline"
              onClick={() => setShowSignatureSheet(false)}
            >
              ← Torna al menu principale
            </button>
            <h2 className="text-2xl font-bold mb-6">Foglio Firme</h2>
            <SignatureSheetSelector />
          </div>
        )}
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
