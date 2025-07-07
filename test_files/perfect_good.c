#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>

#define MAX_BUFFER_SIZE 1024
#define MAX_ARRAY_SIZE 100

// 상수 정의
static const char* VERSION = "1.0.0";

// 구조체 정의
typedef struct {
    int id;
    char name[50];
    double value;
} DataItem;

typedef struct {
    DataItem* items;
    size_t size;
    size_t capacity;
} DataContainer;

// 함수 선언
static DataContainer* createContainer(size_t initialCapacity);
static int addItem(DataContainer* container, int id, const char* name, double value);
static void printContainer(const DataContainer* container);
static void cleanupContainer(DataContainer* container);
static int validateInput(const char* name, double value);

// 메인 함수
int main(void) {
    printf("Perfect C Code Example v%s\n", VERSION);
    
    // 컨테이너 생성
    DataContainer* container = createContainer(10);
    if (container == NULL) {
        fprintf(stderr, "Failed to create container\n");
        return EXIT_FAILURE;
    }
    
    // 데이터 추가
    if (!addItem(container, 1, "Item1", 10.5)) {
        fprintf(stderr, "Failed to add item\n");
        cleanupContainer(container);
        return EXIT_FAILURE;
    }
    
    if (!addItem(container, 2, "Item2", 20.7)) {
        fprintf(stderr, "Failed to add item\n");
        cleanupContainer(container);
        return EXIT_FAILURE;
    }
    
    if (!addItem(container, 3, "Item3", 15.3)) {
        fprintf(stderr, "Failed to add item\n");
        cleanupContainer(container);
        return EXIT_FAILURE;
    }
    
    // 컨테이너 출력
    printContainer(container);
    
    // 정리
    cleanupContainer(container);
    
    printf("Program completed successfully\n");
    return EXIT_SUCCESS;
}

// 컨테이너 생성
static DataContainer* createContainer(size_t initialCapacity) {
    if (initialCapacity == 0 || initialCapacity > MAX_ARRAY_SIZE) {
        return NULL;
    }
    
    DataContainer* container = malloc(sizeof(DataContainer));
    if (container == NULL) {
        return NULL;
    }
    
    container->items = malloc(initialCapacity * sizeof(DataItem));
    if (container->items == NULL) {
        free(container);
        return NULL;
    }
    
    container->size = 0;
    container->capacity = initialCapacity;
    
    return container;
}

// 아이템 추가
static int addItem(DataContainer* container, int id, const char* name, double value) {
    if (container == NULL || name == NULL) {
        return 0;
    }
    
    if (!validateInput(name, value)) {
        return 0;
    }
    
    // 용량 확인 및 확장
    if (container->size >= container->capacity) {
        size_t newCapacity = container->capacity * 2;
        if (newCapacity > MAX_ARRAY_SIZE) {
            newCapacity = MAX_ARRAY_SIZE;
        }
        
        DataItem* newItems = realloc(container->items, newCapacity * sizeof(DataItem));
        if (newItems == NULL) {
            return 0;
        }
        
        container->items = newItems;
        container->capacity = newCapacity;
    }
    
    // 아이템 추가
    DataItem* item = &container->items[container->size];
    item->id = id;
    strncpy(item->name, name, sizeof(item->name) - 1);
    item->name[sizeof(item->name) - 1] = '\0';  // null 종료 보장
    item->value = value;
    
    container->size++;
    return 1;
}

// 컨테이너 출력
static void printContainer(const DataContainer* container) {
    if (container == NULL) {
        return;
    }
    
    printf("Container contents (%zu items):\n", container->size);
    printf("ID\tName\tValue\n");
    printf("--\t----\t-----\n");
    
    for (size_t i = 0; i < container->size; i++) {
        const DataItem* item = &container->items[i];
        printf("%d\t%s\t%.2f\n", item->id, item->name, item->value);
    }
}

// 컨테이너 정리
static void cleanupContainer(DataContainer* container) {
    if (container != NULL) {
        if (container->items != NULL) {
            free(container->items);
        }
        free(container);
    }
}

// 입력 검증
static int validateInput(const char* name, double value) {
    if (name == NULL || strlen(name) == 0) {
        return 0;
    }
    
    if (value < 0.0 || value > 1000.0) {
        return 0;
    }
    
    return 1;
} 