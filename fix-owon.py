import csv
from datetime import datetime

def process_csv(input_file, output_file):
    # Читаем входной файл
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    if not rows:
        print("Файл пуст")
        return
    
    # Парсим начальное время
    start_time = datetime.strptime(rows[0]['Time'], '%Y.%m.%d %H:%M:%S')
    
    # Обрабатываем данные
    result = []
    prev_time_str = None
    time_offset = 0.0
    
    for row in rows:
        current_time_str = row['Time']
        current_time = datetime.strptime(current_time_str, '%Y.%m.%d %H:%M:%S')
        
        # Вычисляем разницу в секундах от начала
        delta_seconds = (current_time - start_time).total_seconds()
        
        # Если время повторяется, добавляем 0.5 сек
        if current_time_str == prev_time_str:
            time_offset += 0.5
        else:
            time_offset = 0.0
        
        final_time = delta_seconds + time_offset
        
        result.append({
            'NO.': row['NO.'],
            'Time': final_time,
            'Voltage': row['Value']
        })
        
        prev_time_str = current_time_str
    
    # Проверяем и удаляем дубликаты по Time
    seen_times = {}
    duplicates = []
    
    for row in result:
        time_val = row['Time']
        if time_val in seen_times:
            duplicates.append(row)
        else:
            seen_times[time_val] = row
    
    # Выводим информацию о дубликатах
    if duplicates:
        print(f"Найдено {len(duplicates)} строк с дублирующимся временем:")
        for dup in duplicates:
            print(f"  NO.={dup['NO.']}, Time={dup['Time']}, Voltage={dup['Voltage']}")
        print("Эти строки будут удалены из результата.\n")
    
    # Оставляем только уникальные записи
    unique_result = list(seen_times.values())
    
    # Сортируем по времени
    unique_result.sort(key=lambda x: x['Time'])
    
    # Записываем результат
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['NO.', 'Time', 'Voltage'])
        writer.writeheader()
        writer.writerows(unique_result)
    
    print(f"Готово!")
    print(f"  Исходных строк: {len(result)}")
    print(f"  Удалено дубликатов: {len(duplicates)}")
    print(f"  Записано в {output_file}: {len(unique_result)} строк")


# Запуск
if __name__ == '__main__':
    import sys
    process_csv(sys.argv[1], sys.argv[2])
