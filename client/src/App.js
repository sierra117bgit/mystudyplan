import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { jsPDF } from 'jspdf';
import './App.css';

const initialCourses = {
    'year1semester1': [
        { id: 'csc102', name: 'Introduction to Programming', credits: 3, prerequisites: ['csc122', 'csc209', 'csc233'], inversePrerequisites: true },
	{ id: 'csc111', name: 'Ethics', credits: 1 },
	{ id: 'csc165', name: 'Discrete Mathematics', credits: 3 },
	{ id: 'gen111', name: 'Man & Ethics of Living', credits: 3 },
	{ id: 'gen121', name: 'Learning & Problem Solving', credits: 3 },
	{ id: 'lng221', name: 'Introduction to Programming', credits: 3 },
        { id: 'math101', name: 'Calculus I', credits: 3, prerequisites: ['math102'], inversePrerequisites: true }
    ],
    'year1semester2': [
        { id: 'csc122', name: 'Intro to prog. Lab', credits: 3, prerequisites: ['csc102']},
	{ id: 'csc209', name: 'Data Structures', credits: 3 },	
	{ id: 'csc233', name: 'Programming Paradigms', credits: 2 },
        { id: 'math102', name: 'Calculus II', credits: 3, prerequisites: ['math101'] }
	{ id: 'csc233', name: 'Statistics', credits: 3 },
	{ id: 'gen231', name: 'Miracle of thinking', credits: 3 },
	{ id: 'lng222', name: 'Academic', credits: 3 },
	
    ],
    'year2semester1': [
        { id: 'csc105', name: 'Web Dev App', credits: 3 },
	{ id: 'csc202', name: 'OO Concept', credits: 1 },
	{ id: 'csc210', name: 'Algorithms', credits: 3 },
	{ id: 'csc218', name: 'DB', credits: 3 },
	{ id: 'csc290', name: 'Integrated Project', credits: 1 },
	{ id: 'csc203', name: 'Com. Arch.', credits: 3 },
	{ id: 'csc201', name: 'Introduction to Something', credits: 3 },
        { id: 'math101', name: 'Calculus I', credits: 4, prerequisites: ['math102'], inversePrerequisites: true }
    ],
};

// Helper function to check if prerequisites are met
function arePrerequisitesMet(courseId, destinationId, allCourses) {
    const course = Object.values(allCourses).flat().find(c => c.id === courseId);
    if (!course || !course.prerequisites) return true;

    const destinationIndex = parseInt(destinationId.replace(/[^\d]/g, ''), 10);
    return course.prerequisites.every(prereq => {
        const prereqCourse = Object.values(allCourses).flat().find(c => c.id === prereq);
        const prereqIndex = prereqCourse ? parseInt(Object.keys(allCourses).find(key => allCourses[key].includes(prereqCourse)).replace(/[^\d]/g, ''), 10) : null;
        if (course.inversePrerequisites) {
            return prereqIndex && prereqIndex > destinationIndex;
        }
        return prereqIndex && prereqIndex < destinationIndex;
    });
}

// Calculate the total credits for each semester
const getTotalCredits = (semesterCourses) => {
    return semesterCourses.reduce((total, course) => total + course.credits, 0);
};

function App() {
    const [courses, setCourses] = useState(initialCourses);

    const onDragEnd = (result) => {
        const { source, destination } = result;
        if (!destination) return; // Dropped outside any droppable area

        if (source.droppableId === destination.droppableId && source.index === destination.index) {
            return; // No movement happened
        }

        const start = courses[source.droppableId];
        const finish = courses[destination.droppableId];

        const startCourseItems = Array.from(start);
        const finishCourseItems = source.droppableId === destination.droppableId ? startCourseItems : Array.from(finish);
        const [removed] = startCourseItems.splice(source.index, 1);

        finishCourseItems.splice(destination.index, 0, removed);

        if (getTotalCredits(finishCourseItems) > 21) {
            alert("A semester cannot have more than 21 credits.");
            return; // Do not update state, effectively reverting the drag
        }

        const newState = {
            ...courses,
            [source.droppableId]: startCourseItems,
            [destination.droppableId]: finishCourseItems,
        };

        if (source.droppableId !== destination.droppableId) {
            if (!arePrerequisitesMet(result.draggableId, destination.droppableId, newState)) {
                alert("You cannot take this course as it has a prerequisite.");
                return; // Exit if prerequisites not met
            }
        }

        setCourses(newState);
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.text('Your Course Plan', 10, 10);
        let y = 20;
        Object.entries(courses).forEach(([semester, courses]) => {
            doc.text(semester.replace('year', 'Year ').replace('semester', ' Semester '), 10, y);
            y += 10;
            courses.forEach(course => {
                doc.text(`${course.name} (${course.credits} credits)`, 10, y);
                y += 10;
            });
            y += 10;
        });
        doc.save('course-plan.pdf');
    };

    return (
        <div className="App">
            <header>
                <h1>My Study Planner</h1>
                <h2>134 Credits Required to Graduate</h2>
            </header>
            <DragDropContext onDragEnd={onDragEnd}>
                {Object.entries(courses).map(([semesterId, semesterCourses]) => (
                    <Droppable droppableId={semesterId} key={semesterId}>
                        {(provided) => (
                            <div ref={provided.innerRef} {...provided.droppableProps} className="semester">
                                <h3>{semesterId.replace('year', 'Year ').replace('semester', ' Semester ')} - {getTotalCredits(semesterCourses)} Credits</h3>
                                {semesterCourses.map((course, index) => (
                                    <Draggable key={course.id} draggableId={course.id} index={index}>
                                        {(provided) => (
                                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="course">
                                                {course.name} ({course.credits} credits)
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                ))}
            </DragDropContext>
            <button onClick={generatePDF} style={{ marginTop: '20px' }}>Download Plan</button>
        </div>
    );
}

export default App;