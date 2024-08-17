# Use an official Ruby runtime as a parent image
FROM ruby:3.3.0

# Set environment variables
ENV RAILS_ENV=development
ENV RACK_ENV=development

# Install dependencies
RUN apt-get update -qq && apt-get install -y nodejs postgresql-client

# Set the working directory
WORKDIR /rails

# Copy the Gemfile and Gemfile.lock
COPY Gemfile /rails/Gemfile
COPY Gemfile.lock /rails/Gemfile.lock

# Install the gem dependencies
RUN bundle install

# Copy the rest of the application code
COPY . /rails

# Precompile assets (if necessary)
# RUN bundle exec rake assets:precompile

# Expose port 3000 to the Docker host
# EXPOSE 3000

# The command to run the application
CMD ["rails", "server", "-b", "0.0.0.0"]
# CMD ["./bin/dev"]