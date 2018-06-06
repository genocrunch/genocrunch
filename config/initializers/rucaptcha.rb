RuCaptcha.configure do
  self.cache_store = :file_store
  self.expires_in = 2.minutes
  self.style = :black_white
  self.length = 5
  self.strikethrough = false
end
