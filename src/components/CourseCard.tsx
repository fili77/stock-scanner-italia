
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Users, Clock, CalendarDays } from 'lucide-react';

export type Course = {
  id: string;
  name: string;
  totalStudents?: number; // Make totalStudents optional
  lastScanned?: string;
  attendanceRate?: number;
  nextClass?: string;
};

type CourseCardProps = {
  course: Course;
  onClick?: (course: Course) => void;
  selected?: boolean;
  className?: string;
};

const CourseCard = ({ course, onClick, selected = false, className }: CourseCardProps) => {
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-200 hover:shadow-card cursor-pointer",
        selected && "ring-2 ring-primary",
        className
      )}
      onClick={() => onClick?.(course)}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{course.name}</CardTitle>
            <CardDescription className="flex items-center mt-1 gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>{course.totalStudents || 0} students</span>
            </CardDescription>
          </div>
          {course.attendanceRate !== undefined && (
            <Badge variant="outline" className="bg-accent/50 text-accent-foreground font-medium">
              {course.attendanceRate}% attendance
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        {course.lastScanned && (
          <div className="flex items-center text-xs text-muted-foreground gap-1.5 mb-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>Last scan: {course.lastScanned}</span>
          </div>
        )}
        {course.nextClass && (
          <div className="flex items-center text-xs text-muted-foreground gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Next: {course.nextClass}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CourseCard;
