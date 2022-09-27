import { getRepository } from "typeorm"
import { NextFunction, Request, Response } from "express"

import { Group } from "../entity/group.entity"
import { CreateGroupInput, UpdateGroupInput } from "../interface/group.interface"

export class GroupController {
  private groupRepository = getRepository(Group)

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
    // Task 1: 
        
    // Return the list of Students that are in a Group
  }


  async runGroupFilters(request: Request, response: Response, next: NextFunction) {
    // Task 2:
  
    // 1. Clear out the groups (delete all the students from the groups)

    // 2. For each group, query the student rolls to see which students match the filter for the group

    // 3. Add the list of students that match the filter to the group
  }
}
