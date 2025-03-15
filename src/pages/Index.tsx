
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Camera, BarChart2, Settings, Layers } from 'lucide-react';
import Header from '@/components/Header';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 container max-w-md mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl font-bold mb-3">ScanAttendance</h1>
          <p className="text-muted-foreground">
            Scansiona codici a barre degli studenti e registra le presenze in modo semplice e veloce
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Button 
              variant="default"
              size="lg"
              className="w-full h-20 text-xl"
              onClick={() => navigate('/scan')}
            >
              <Camera className="mr-2 h-6 w-6" />
              Scansiona Presenze
            </Button>
          </motion.div>
          
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Button 
                variant="outline"
                size="lg"
                className="w-full h-24 flex flex-col items-center justify-center"
                onClick={() => navigate('/courses')}
              >
                <Layers className="h-6 w-6 mb-2" />
                <span>Corsi</span>
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Button 
                variant="outline"
                size="lg"
                className="w-full h-24 flex flex-col items-center justify-center"
                onClick={() => navigate('/courses')}
              >
                <BarChart2 className="h-6 w-6 mb-2" />
                <span>Statistiche</span>
              </Button>
            </motion.div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Button 
              variant="ghost"
              size="lg"
              className="w-full"
              onClick={() => navigate('/settings')}
            >
              <Settings className="mr-2 h-5 w-5" />
              Impostazioni
            </Button>
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-16 text-center text-sm text-muted-foreground"
        >
          <p>Connetti il tuo foglio Google Sheets</p>
          <p>dalle impostazioni dell'app</p>
        </motion.div>
      </main>
    </div>
  );
};

export default Index;
