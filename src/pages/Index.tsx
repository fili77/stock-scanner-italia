
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Scan, BarChart4, Settings, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CourseCard, { Course } from '@/components/CourseCard';
import Header from '@/components/Header';
import googleSheetsAPI from '@/utils/googleSheetsAPI';

// Import framer-motion
<lov-add-dependency>framer-motion@^11.0.8</lov-add-dependency>

const Index = () => {
  const { data: courses, isLoading, refetch } = useQuery({
    queryKey: ['courses'],
    queryFn: () => googleSheetsAPI.getCourses(),
  });

  // Staggered animation for cards
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

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 container max-w-5xl px-4 py-6 md:py-8">
        <section className="mb-10">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-2">ScanAttendance</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Quickly scan student barcodes and automatically record attendance
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8"
          >
            <Link to="/scan">
              <Card className="h-full hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Scan className="mr-2 h-4 w-4" />
                    Scan Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Scan student barcodes to mark attendance for today's class
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/courses">
              <Card className="h-full hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <BarChart4 className="mr-2 h-4 w-4" />
                    View Courses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Browse courses and view detailed attendance statistics
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/settings">
              <Card className="h-full hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Configure Google Sheets integration and app preferences
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </section>
        
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Courses</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-rotate' : ''}`} />
              Refresh
            </Button>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-muted rounded w-full mb-2" />
                    <div className="h-3 bg-muted rounded w-4/5" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {courses?.map((course) => (
                <motion.div key={course.id} variants={itemVariants}>
                  <CourseCard 
                    course={course}
                    onClick={() => {}}
                  />
                </motion.div>
              ))}
              
              <motion.div variants={itemVariants}>
                <Link to="/courses">
                  <Card className="h-full flex items-center justify-center p-6 border-dashed hover:bg-accent/20 transition-colors duration-200">
                    <div className="text-center">
                      <p className="text-muted-foreground mb-2">View all courses</p>
                      <ArrowRight className="h-5 w-5 mx-auto text-muted-foreground" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            </motion.div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;
