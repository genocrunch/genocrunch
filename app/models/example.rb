class Example < ApplicationRecord

  validates :job_key,
    :presence => true,
    :uniqueness => {
      :case_sensitive => false
    },
    :inclusion => {
      :in => Job.all.map{|j| j.key}
    }

end
