# **Scalable Database Schema for MCQ Testing Platform**

This document outlines a high-performance, flexible database architecture designed to support a multi-subject, multi-unit educational platform with various question types and dual-entry points (Exam-based vs. Subject-based browsing).

## **1\. Core Architecture Strategy**

The system utilizes a **Hybrid Relational-Document model**. Relational tables handle the strict hierarchy and relationships, while **JSONB** (in PostgreSQL) or similar document-style storage handles the varying structures of different question types (MCQs, Matching, Rearranging, etc.).

## **2\. Database Schema Definition**

### **2.1 Educational Hierarchy**

The following tables define the standard path: **Subject → Unit → Exercise (Topic)**.

| Table | Primary Columns | Description   |
| :---- | :---- | :---- |
| **subjects** | id (UUID), name, slug | Top-level categories like "Physics" or "Python". |
| **units** | id, subject\_id (FK), title, order\_index | Chapters within a subject (e.g., "Gravitation"). |
| **exercises** | id, unit\_id (FK), title, duration, points | Specific topics or test sets containing questions. |

### **2.2 Exam Integration (Many-to-Many)**

To allow an Exam (e.g., "NIMCET") to contain multiple subjects without duplicating data, a join table is used.

| Table | Primary Columns | Description   |
| :---- | :---- | :---- |
| **exams** | id, title, description | The target examination (e.g., "JEE 2026"). |
| **exam\_subjects** | exam\_id (FK), subject\_id (FK), order | Maps which subjects belong to which exam. |

## **3\. Question Storage Strategy (JSONB)**

The questions table uses a **content** column of type JSONB to store the specific logic for each question type.

\-- Schema Example  
CREATE TABLE questions (  
  id UUID PRIMARY KEY,  
  exercise\_id UUID REFERENCES exercises(id),  
  type TEXT, \-- 'MCQ', 'MATCHING', 'REORDER'  
  points INT,  
  content JSONB \-- Flexible payload  
);

### **Content Payload Examples**

* **MCQ:** {"options": \["A", "B", "C"\], "correct\_index": 0}  
* **Match:** {"left": \["Apple", "Cat"\], "right": \["Fruit", "Animal"\], "map": {"Apple": "Fruit"}}  
* **Reorder:** {"items": \["Start", "Middle", "End"\], "order": \[0, 1, 2\]}

## **4\. Performance & Scalability Tips**

1. **Indexing:** Always index foreign keys (subject\_id, unit\_id, exercise\_id) to ensure sub-millisecond query times even with millions of rows.  
2. **Denormalization:** If the hierarchy becomes very deep, consider storing a subject\_id directly on the exercises table to skip a join when fetching all topics for a subject.  
3. **Caching:** Store the JSONB question payloads in a Redis cache for active exams to reduce database load during peak traffic.