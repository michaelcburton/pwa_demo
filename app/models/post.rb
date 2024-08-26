class Post < ApplicationRecord
  has_many :items, dependent: :destroy
  accepts_nested_attributes_for :items, allow_destroy: true, reject_if: proc { |attributes| attributes['description'].blank? }
end
