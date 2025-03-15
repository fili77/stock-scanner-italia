
import React from 'react';
import { Loader2 } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ScanStatus } from '@/hooks/useAttendance';

type CourseSelectorProps = {
  selectedCourse: string;
  onCourseChange: (value: string) => void;
  courses?: { id: string; name: string }[];
  isLoadingCourses: boolean;
  scanStatus: ScanStatus;
};

const CourseSelector = ({
  selectedCourse,
  onCourseChange,
  courses,
  isLoadingCourses,
  scanStatus
}: CourseSelectorProps) => {
  return (
    <div className="mb-8">
      <label className="block text-sm font-medium mb-2">Seleziona Corso</label>
      <Select
        value={selectedCourse}
        onValueChange={onCourseChange}
        disabled={isLoadingCourses || scanStatus === 'scanning' || scanStatus === 'processing'}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Seleziona un corso" />
        </SelectTrigger>
        <SelectContent>
          {isLoadingCourses ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-rotate text-muted-foreground" />
            </div>
          ) : (
            courses?.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CourseSelector;
