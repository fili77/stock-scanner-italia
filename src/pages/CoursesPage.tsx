
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Filter, Loader2, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import Header from '@/components/Header';
import CourseCard, { Course as CourseCardType } from '@/components/CourseCard';
import AttendanceStats from '@/components/AttendanceStats';
import AddCourseDialog from '@/components/AddCourseDialog';
import googleSheetsAPI, { Course as ApiCourse } from '@/utils/googleSheetsAPI';

const CoursesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<CourseCardType | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: courses, isLoading: isLoadingCourses, refetch } = useQuery({
    queryKey: ['courses'],
    queryFn: () => googleSheetsAPI.getCourses(),
  });

  const { data: attendanceStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['attendance-stats', selectedCourse?.id],
    queryFn: () => googleSheetsAPI.getAttendanceStats(selectedCourse?.id || ''),
    enabled: !!selectedCourse,
  });

  // Map API courses to CourseCard type
  const mappedCourses: CourseCardType[] = courses?.map(course => ({
    id: course.id,
    name: course.name,
    totalStudents: course.totalStudents,
    // Add any other properties if needed
  })) || [];

  // Filter courses based on search query
  const filteredCourses = mappedCourses.filter(course => 
    course.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Select first course by default when data loads
  useEffect(() => {
    if (mappedCourses.length && !selectedCourse) {
      setSelectedCourse(mappedCourses[0]);
    }
  }, [mappedCourses, selectedCourse]);

  // Staggered animation for courses
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24
      }
    }
  };

  const handleCourseAdded = () => {
    refetch();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 container max-w-7xl px-4 py-6">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Corsi e Presenze</h1>
            <p className="text-muted-foreground">
              Visualizza e gestisci le statistiche di presenza ai corsi
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            <span>Aggiungi Corso</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course list */}
          <div className="lg:col-span-1">
            <div className="mb-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca corsi..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            
            {isLoadingCourses ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-rotate text-muted-foreground" />
              </div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {filteredCourses?.map((course) => (
                  <motion.div key={course.id} variants={itemVariants}>
                    <CourseCard
                      course={course}
                      onClick={(course) => setSelectedCourse(course)}
                      selected={selectedCourse?.id === course.id}
                    />
                  </motion.div>
                ))}
                
                {filteredCourses?.length === 0 && (
                  <div className="text-center py-12 border rounded-lg bg-muted/20">
                    <p className="text-muted-foreground">Nessun corso trovato</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
          
          {/* Course details */}
          <div className="lg:col-span-2">
            {selectedCourse ? (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="overview">Panoramica</TabsTrigger>
                  <TabsTrigger value="attendance">Presenze</TabsTrigger>
                  <TabsTrigger value="students">Studenti</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold mb-1">{selectedCourse.name}</h2>
                      <p className="text-sm text-muted-foreground">
                        {selectedCourse.totalStudents || 0} studenti iscritti
                      </p>
                    </div>
                    
                    <Separator />
                    
                    {isLoadingStats ? (
                      <div className="flex items-center justify-center p-12">
                        <Loader2 className="h-5 w-5 animate-rotate text-muted-foreground" />
                      </div>
                    ) : (
                      <AttendanceStats
                        courseId={selectedCourse.id}
                        courseName={selectedCourse.name}
                        stats={attendanceStats || []}
                      />
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="attendance">
                  <div className="text-center py-20 border rounded-lg bg-muted/20">
                    <p className="text-muted-foreground">I dettagli delle presenze appariranno qui</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="students">
                  <div className="text-center py-20 border rounded-lg bg-muted/20">
                    <p className="text-muted-foreground">L'elenco degli studenti apparirà qui</p>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex items-center justify-center h-full border rounded-lg bg-muted/20 p-12">
                <p className="text-muted-foreground">Seleziona un corso per visualizzare i dettagli</p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <AddCourseDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen} 
        onCourseAdded={handleCourseAdded}
      />
    </div>
  );
};

export default CoursesPage;
