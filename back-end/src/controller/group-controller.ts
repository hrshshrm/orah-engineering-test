import { getRepository } from "typeorm"
import { NextFunction, Request, Response } from "express"

import { Group } from "../entity/group.entity"
import { CreateGroupInput, UpdateGroupInput } from "../interface/group.interface"
import { Student } from "../entity/student.entity"
import { GroupStudent } from "../entity/group-student.entity"
import { StudentRollState } from "../entity/student-roll-state.entity"
import { CreateGroupStudentInput } from "../interface/group-student.interface"

export class GroupController {
  private groupRepository = getRepository(Group)
  private studentRepository = getRepository(Student)
  private groupStudentRepository = getRepository(GroupStudent)
  private studentRollStateRepository = getRepository(StudentRollState)

  async allGroups(request: Request, response: Response, next: NextFunction) {
    // Task 1: Return the list of all groups
    return this.groupRepository.find()
  }

  async createGroup(request: Request, response: Response, next: NextFunction) {
    // Task 1: Add a Group
    const { body: params } = request

    if(!(params.ltmt === '<' || params.ltmt === '>')) {
      response.status(400)
      return {
        "message": "Field ltmt can only be '<' or '>'"
      }
    }

    const validRoleStates = params.roll_states.split(',').every((item) => ['unmark', 'present', 'absent', 'late'].includes(item))
    if(!validRoleStates) {
      response.status(400)
      return {
        "message": "Field roll_states only allows one or more amongst 'unmark', 'present', 'absent', 'late' values"
      }
    }

    const createGroupInput: CreateGroupInput = {
      name: params.name,
      number_of_weeks: params.number_of_weeks,
      roll_states: params.roll_states,
      incidents: params.incidents,
      ltmt: params.ltmt,
      run_at: null,
      student_count: 0
    }
    const group = new Group()
    group.prepareToCreate(createGroupInput)

    return await this.groupRepository.save(group)
  }

  async updateGroup(request: Request, response: Response, next: NextFunction) {
    // Task 1:  Update a Group
    const { body: params } = request

    const groupToUpdate = await this.groupRepository.findOne(params.id)
    if(groupToUpdate) {

      if(!(params.ltmt === '<' || params.ltmt === '>')) {
        response.status(400)
        return {
          "message": "Field ltmt can only be '<' or '>'"
        }
      }
  
      const validRoleStates = params.roll_states.split(',').every((item) => ['unmark', 'present', 'absent', 'late'].includes(item))
      if(!validRoleStates) {
        response.status(400)
        return {
          "message": "Field roll_states only allows one or more amongst 'unmark', 'present', 'absent', 'late' values"
        }
      }

      const updateGroupInput: UpdateGroupInput = {
        id: params.id,
        name: params.name,
        number_of_weeks: params.number_of_weeks,
        roll_states: params.roll_states,
        incidents: params.incidents,
        ltmt: params.ltmt,
        run_at: params.run_at,
        student_count: params.student_count
      }
      groupToUpdate.prepareToUpdate(updateGroupInput)
      return this.groupRepository.save(groupToUpdate)
    } else {
      response.status(400)
      return {
        "message": `Group with ID '${params.id}' not found.`
      }
    }
  }

  async removeGroup(request: Request, response: Response, next: NextFunction) {
    // Task 1: Delete a Group
    const { params: params } = request

    const groupToRemove = await this.groupRepository.findOne(params.id)
    if(groupToRemove) {
      return this.groupRepository.remove(groupToRemove)
    } else {
      response.status(400)
      return {
        "message": `Group with ID '${params.id}' not found.`
      }
    }
  }

  async getGroupStudents(request: Request, response: Response, next: NextFunction) {
    // Task 1: Return the list of Students that are in a Group
    const { params: params } = request

    const groupToRemove = await this.groupRepository.findOne(params.id)
    if(groupToRemove) {
      // SELECT s.id, s.first_name, s.last_name, s.first_name || ' ' || s.last_name AS full_name FROM student AS s LEFT JOIN group_student AS gs ON s.id = gs.student_id WHERE gs.group_id = '${params.id}'
      const students = await this.studentRepository
        .createQueryBuilder('s')
        .select(['s.id AS id', 's.first_name AS first_name', 's.last_name AS last_name', 's.first_name || " " || s.last_name AS full_name' ])
        .leftJoin('group_student', 'gs')
        .where('s.id = gs.student_id')
        .andWhere('gs.group_id = :gid', { gid: params.id})
        .getRawMany()
      return students
    } else {
      response.status(400)
      return {
        "message": `Group with ID '${params.id}' not found.`
      }
    }
  }


  async runGroupFilters(request: Request, response: Response, next: NextFunction) {
    // Task 2:
    // 1. Clear out the groups (delete all the students from the groups)
    // 2. For each group, query the student rolls to see which students match the filter for the group
    // 3. Add the list of students that match the filter to the group
    const result = []

    await this.groupStudentRepository.clear()
    const groups = await this.groupRepository.find()

    for(const group of groups) {
      const rollStates = group.roll_states.split(',')
      const numberOfDays = group.number_of_weeks * 7
      const startDate = new Date(new Date().setDate(new Date().getDate() - numberOfDays)).toISOString()
      const endDate = new Date().toISOString()

      const incidentData = await this.studentRollStateRepository.createQueryBuilder('srs')
        .select(['srs.student_id AS student_id', `${group.id} AS group_id`, 'COUNT(*) AS incident_count'])
        .leftJoin('roll', 'r')
        .where('r.id = srs.roll_id')
        .andWhere('srs.state IN (:...states)', { states: rollStates })
        .andWhere('r.completed_at BETWEEN :start AND :end', { start: startDate, end: endDate })
        .groupBy('srs.student_id')
        .having(`COUNT(*) ${group.ltmt} ${group.incidents}`)
        .getRawMany()

      incidentData.forEach(async (data) => {
        const createGroupStudentInput: CreateGroupStudentInput = {
          student_id: data.student_id,
          group_id: data.group_id,
          incident_count: data.incident_count
        }
        const groupStudent = new GroupStudent()
        groupStudent.prepareToCreate(createGroupStudentInput)
        await this.groupStudentRepository.save(groupStudent)
      })

      const updateGroupInput: UpdateGroupInput = {
        id: group.id,
        run_at: new Date(startDate),
        student_count: incidentData.length
      }
      await this.groupRepository.save(updateGroupInput)
      result.push({ name: group.name, ...updateGroupInput })
    }

    return result
  }
}
