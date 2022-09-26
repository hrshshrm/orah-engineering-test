import { getRepository } from "typeorm"
import { NextFunction, Request, Response } from "express"
import { Student } from "../entity/student.entity"
import { CreateStudentInput, UpdateStudentInput } from "../interface/student.interface"

export class StudentController {
  private studentRepository = getRepository(Student)

  async allStudents(request: Request, response: Response, next: NextFunction) {
    return this.studentRepository.find()
  }

  async getStudent(request: Request, response: Response, next: NextFunction) {
      const student = await this.studentRepository.findOne(request.params.id)
      if(student) {
        return student
      } else {
        response.status(400)
        return {
          "message": `User with ID '${request.params.id}' not found.`
        }
      }
  }

  async createStudent(request: Request, response: Response, next: NextFunction) {
    const { body: params } = request

    const createStudentInput: CreateStudentInput = {
      first_name: params.first_name,
      last_name: params.last_name,
      photo_url: params.photo_url,
    }
    const student = new Student()
    student.prepareToCreate(createStudentInput)

    response.status(201)
    return this.studentRepository.save(student)
  }

  async updateStudent(request: Request, response: Response, next: NextFunction) {
    const { body: params } = request

    const studentToUpdate = await this.studentRepository.findOne(params.id)
    if(studentToUpdate) {
      const updateStudentInput: UpdateStudentInput = {
        id: params.id,
        first_name: params.first_name,
        last_name: params.last_name,
        photo_url: params.photo_url,
      }
      studentToUpdate.prepareToUpdate(updateStudentInput)

      return this.studentRepository.save(studentToUpdate)
    } else {
      response.status(400)
      return {
        "message": `User with ID '${params.id}' not found.`
      }
    }
  }

  async removeStudent(request: Request, response: Response, next: NextFunction) {
    let studentToRemove = await this.studentRepository.findOne(request.params.id)
    if(studentToRemove) {
      return this.studentRepository.remove(studentToRemove)
    } else {
      response.status(400)
      return {
        "message": `User with ID '${request.params.id}' not found.`
      }
    }
  }
}
