
import React from 'react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import googleSheetsAPI from '@/utils/googleSheetsAPI';

interface AddCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCourseAdded?: () => void;
}

const AddCourseDialog = ({ open, onOpenChange, onCourseAdded }: AddCourseDialogProps) => {
  const [courseId, setCourseId] = useState('');
  const [courseName, setCourseName] = useState('');
  const [teacher, setTeacher] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!courseId || !courseName || !teacher) {
      toast.error('Tutti i campi sono obbligatori.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Check if we have a Google Apps Script URL set
      const appsScriptUrl = googleSheetsAPI.getAppsScriptUrl();
      if (!appsScriptUrl && !googleSheetsAPI.getOnlineStatus()) {
        // We're in offline mode and we'll use mock data
        toast.info('Applicazione in modalità offline. Il corso sarà salvato localmente.');
      }

      const success = await googleSheetsAPI.addCourse({
        id: courseId,
        name: courseName,
        teacher
      });
      
      if (success) {
        toast.success('Corso aggiunto con successo!');
        setCourseId('');
        setCourseName('');
        setTeacher('');
        onOpenChange(false);
        if (onCourseAdded) onCourseAdded();
      } else {
        toast.error('Errore durante l\'aggiunta del corso. Controlla la configurazione del Google Apps Script.');
      }
    } catch (error) {
      console.error('Errore:', error);
      toast.error('Si è verificato un errore. Riprova più tardi o verifica la configurazione.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Aggiungi Nuovo Corso</DialogTitle>
          <DialogDescription>Inserisci i dettagli del nuovo corso da aggiungere.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="courseId">ID Corso</Label>
            <Input
              id="courseId"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              placeholder="C123"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="courseName">Nome Corso</Label>
            <Input
              id="courseName"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="Informatica di base"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="teacher">Docente</Label>
            <Input
              id="teacher"
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              placeholder="Prof. Mario Rossi"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvataggio...' : 'Salva'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCourseDialog;
