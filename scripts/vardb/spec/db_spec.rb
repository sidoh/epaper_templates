require_relative "../variabledb"

RSpec.describe Database do
  describe "#set" do
    it "Should store values without crashing" do
      Database.open_tmp do |db|
        db.set("a", "1")
        db.set("b", "2")
      end
    end
  end

  describe "#get" do
    it "Should have read-after-write consistency for simple values" do
      Database.open_tmp do |db|
        vals = {
          "a" => "1",
          "b" => "2",
          "c" => "3"
        }

        begin
          vals.each { |k, v| db.set(k, v) }
          vals.each do |k, v|
            expect(db.get(k)).to eq(v)
          end
        rescue StandardError => e
          db.dump
          raise e
        end
      end
    end

    it "Should allow us to overwrite values" do
      Database.open_tmp do |db|
        db.set("a", "1")
        db.set("a", "2")

        expect(db.get("a")).to eq("2")
      end
    end

    it "Should allow us to overwrite with different lengths" do
      Database.open_tmp do |db|
        begin
          db.set("a", "1")
          expect(db.get("a")).to eq("1")

          db.set("a", "1234")
          expect(db.get("a")).to eq("1234")

          lens = (1..5).to_a + (1..4).to_a.reverse
          lens.each do |l|
            val = "1"*l
            db.set("a", val)
            expect(db.get("a")).to eq(val)
          end

          db.set("b", "bb")
          db.set("c", "ccc")

          expect(db.get("b")).to eq("bb")
          expect(db.get("c")).to eq("ccc")

          db.set("c", "cccc")
          expect(db.get("c")).to eq("cccc")

          db.set("d", "ddd")
          expect(db.get("d")).to eq("ddd")
          expect(db.get("a")).to eq("1")

          db.dump
        rescue StandardError => e
          db.dump
          raise e
        end
      end
    end
  end
end