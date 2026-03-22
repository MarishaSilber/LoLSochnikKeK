#!/usr/bin/env python3
from rembg import remove
from PIL import Image

# Открываем изображение
input_path = 'telegram-cloud-photo-size-2-5328153689904059111-y.jpg'
output_path = 'src/assets/sochnik.png'

print("Обработка изображения...")

# Открываем и удаляем фон
with open(input_path, 'rb') as i:
    input_data = i.read()
    output_data = remove(input_data)

# Сохраняем результат
with open(output_path, 'wb') as o:
    o.write(output_data)

print(f"Готово! Изображение сохранено в {output_path}")
