#include <iostream>
#include <vector>
#include <string>
#include <memory>
#include <algorithm>

class Calculator {
private:
    std::string name;
    
public:
    Calculator(const std::string& calcName) : name(calcName) {}
    
    int add(int a, int b) const {
        return a + b;
    }
    
    int subtract(int a, int b) const {
        return a - b;
    }
    
    void printName() const {
        std::cout << "Calculator: " << name << std::endl;
    }
};

class DataProcessor {
private:
    std::vector<int> data;
    
public:
    void addData(int value) {
        data.push_back(value);
    }
    
    int getSum() const {
        int sum = 0;
        for (const auto& value : data) {
            sum += value;
        }
        return sum;
    }
    
    void printData() const {
        std::cout << "Data: ";
        for (const auto& value : data) {
            std::cout << value << " ";
        }
        std::cout << std::endl;
    }
    
    void sortData() {
        std::sort(data.begin(), data.end());
    }
};

int main() {
    std::cout << "Good C++ Code Example" << std::endl;
    
    // Calculator 사용
    Calculator calc("MyCalculator");
    calc.printName();
    
    int result1 = calc.add(10, 5);
    int result2 = calc.subtract(10, 5);
    
    std::cout << "10 + 5 = " << result1 << std::endl;
    std::cout << "10 - 5 = " << result2 << std::endl;
    
    // DataProcessor 사용
    DataProcessor processor;
    processor.addData(5);
    processor.addData(3);
    processor.addData(8);
    processor.addData(1);
    
    processor.printData();
    std::cout << "Sum: " << processor.getSum() << std::endl;
    
    processor.sortData();
    std::cout << "After sorting: ";
    processor.printData();
    
    // Smart pointer 사용
    auto smartCalc = std::make_unique<Calculator>("SmartCalculator");
    smartCalc->printName();
    
    return 0;
} 