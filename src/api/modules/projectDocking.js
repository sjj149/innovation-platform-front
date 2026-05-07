import { del, get, handleResponse, post } from '../request'

export function applyToProject(projectId, data) {
  return handleResponse(post(`/information-link/projects/${projectId}/applications`, data))
}

export function getProjectApplications(projectId) {
  return handleResponse(get(`/information-link/projects/${projectId}/applications`))
}

export function withdrawProjectApplication(applicationId) {
  return handleResponse(post(`/information-link/project-applications/${applicationId}/withdraw`))
}

export function reviewProjectApplication(applicationId, data) {
  return handleResponse(post(`/information-link/project-applications/${applicationId}/review`, data))
}

export function createProjectRecruitment(projectId, data) {
  return handleResponse(post(`/information-link/projects/${projectId}/recruitments`, data))
}

export function getProjectRecruitments(projectId) {
  return handleResponse(get(`/information-link/projects/${projectId}/recruitments`))
}

export function deleteProjectRecruitment(recruitmentId) {
  return handleResponse(del(`/information-link/recruitments/${recruitmentId}`))
}

export function applyToRecruitment(recruitmentId, data) {
  return handleResponse(post(`/information-link/recruitments/${recruitmentId}/applications`, data))
}

export function getRecruitmentApplications(projectId) {
  return handleResponse(get(`/information-link/projects/${projectId}/recruitment-applications`))
}

export function withdrawRecruitmentApplication(applicationId) {
  return handleResponse(post(`/information-link/recruitment-applications/${applicationId}/withdraw`))
}

export function reviewRecruitmentApplication(applicationId, data) {
  return handleResponse(post(`/information-link/recruitment-applications/${applicationId}/review`, data))
}
