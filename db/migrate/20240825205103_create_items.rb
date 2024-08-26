class CreateItems < ActiveRecord::Migration[7.1]
  def change
    create_table :items do |t|
      t.references :post, null: false, foreign_key: true
      t.string :description

      t.timestamps
    end
  end
end
