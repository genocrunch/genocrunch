json.array!(@jobs) do |job|
  json.extract! job, :id, :name, :input, :map, :params, :output, :status
  json.url job_url(job, format: :json)
end
