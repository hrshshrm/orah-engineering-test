export interface CreateGroupInput {
    name: string
    number_of_weeks: number
    roll_states: string, // ['unmark', 'present', 'absent', 'late']
    incidents: number
    ltmt: '<' | '>'
    run_at: Date
    student_count: number
}

export interface UpdateGroupInput {
    id: number,
    name?: string
    number_of_weeks?: number
    roll_states?: string
    incidents?: number
    ltmt?: '<' | '>'
    run_at?: Date
    student_count?: number
}