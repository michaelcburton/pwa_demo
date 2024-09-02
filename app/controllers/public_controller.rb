class PublicController < ApplicationController
  def index
    response.headers['Cache-Control'] = 'public, max-age=31536000'
  end
end