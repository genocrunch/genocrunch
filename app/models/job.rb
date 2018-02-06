class Job < ActiveRecord::Base

  belongs_to :user

  # START THE JOB
  def perform
    self.update_attribute("status", 'running')

    `rails run_job[#{self.key}]`
    
  end

  def success
    self.status = "completed"
    self.save
  end

  def failure
    self.status = "failed"
    self.output = "unavailable"
    self.save
  end

  def abort
    self.kill
  end

end
