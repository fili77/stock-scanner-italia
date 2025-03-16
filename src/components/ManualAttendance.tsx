
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import googleSheetsAPI from '@/utils/googleSheetsAPI';

const studentSchema = z.object({
  firstName: z.string().min(2, { message: 'Il nome deve contenere almeno 2 caratteri' }),
  lastName: z.string().min(2, { message: 'Il cognome deve contenere almeno 2 caratteri' }),
  studentId: z.string().optional(),
  courseId: z.string({
    required_error: 'Seleziona un corso',
  }),
});

type StudentFormValues = z.infer<typeof studentSchema>;

interface ManualAttendanceProps {
  selectedCourseId: string;
  onSuccess?: () => void;
}

const ManualAttendance = ({ selectedCourseId, onSuccess }: ManualAttendanceProps) => {
  const { toast } = useToast();
  
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      studentId: '',
      courseId: selectedCourseId,
    },
  });

  const onSubmit = async (data: StudentFormValues) => {
    try {
      // Costruisci un ID studente se non fornito
      const studentId = data.studentId || `MANUAL-${Date.now()}`;
      
      // Costruisci il nome completo
      const fullName = `${data.lastName} ${data.firstName}`;
      
      // Registra la presenza
      const today = new Date().toISOString().split('T')[0];
      await googleSheetsAPI.markAttendance(studentId, data.courseId, today);
      
      toast({
        title: 'Presenza registrata',
        description: `${fullName} è stato registrato come presente.`,
      });
      
      // Reset del form
      form.reset();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Errore durante la registrazione della presenza:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile registrare la presenza. Riprova più tardi.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-background">
      <h3 className="text-lg font-semibold">Registrazione manuale presenza</h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cognome</FormLabel>
                <FormControl>
                  <Input placeholder="Inserisci cognome" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Inserisci nome" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="studentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Matricola (opzionale)</FormLabel>
                <FormControl>
                  <Input placeholder="Inserisci matricola" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full">Registra presenza</Button>
        </form>
      </Form>
    </div>
  );
};

export default ManualAttendance;
