#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_SIZE 100

// 함수 선언
int calculateSum(int a, int b);
void printMessage(const char* message);
int* createArray(int size);

int main() {
    printf("Hello, World!\n");
    
    int result = calculateSum(5, 3);
    printf("Sum: %d\n", result);
    
    printMessage("This is a good C code example");
    
    int* arr = createArray(5);
    if (arr != NULL) {
        for (int i = 0; i < 5; i++) {
            arr[i] = i * 2;
        }
        
        for (int i = 0; i < 5; i++) {
            printf("arr[%d] = %d\n", i, arr[i]);
        }
        
        free(arr);
    }
    
    return 0;
}

int calculateSum(int a, int b) {
    return a + b;
}

void printMessage(const char* message) {
    if (message != NULL) {
        printf("Message: %s\n", message);
    }
}

int* createArray(int size) {
    if (size <= 0 || size > MAX_SIZE) {
        return NULL;
    }
    
    int* arr = (int*)malloc(size * sizeof(int));
    if (arr == NULL) {
        return NULL;
    }
    
    memset(arr, 0, size * sizeof(int));
    return arr;
} 