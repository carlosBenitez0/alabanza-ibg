import { getAssignmentRoleLabel, getAssignmentStatusColor, getAssignmentStatusLabel, cn } from '@/lib/utils'
import type { AssignmentRole, AssignmentStatus } from '@/types'
import { Badge } from '@/components/ui'

export const ASSIGNMENT_ROLES: AssignmentRole[] = ['lead_vocal', 'choir', 'musician', 'sound', 'media']
export const ASSIGNMENT_STATUSES: AssignmentStatus[] = ['pending', 'confirmed', 'declined']

export function StatusBadge({ status }: { status: AssignmentStatus }) {
  return (
    <Badge size="sm" className={cn(getAssignmentStatusColor(status))}>
      {getAssignmentStatusLabel(status)}
    </Badge>
  )
}

export { getAssignmentRoleLabel, getAssignmentStatusLabel }
