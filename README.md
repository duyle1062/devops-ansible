# 📘 TASK ANSIBLE



# 👤 TRỌNG TÍN

## ✅ TASK 1 — Chỉnh sửa file group vars


### Bước 1: copy nội dung này

```yaml
app_name: foodi
deploy_path: /var/www/html
```

---

### Bước 2: sửa file

Mở file:

```bash
nano ansible/roles/app/tasks/main.yml
```

---

Tìm dòng:

```yaml
dest: /var/www/html
```

👉 sửa thành:

```yaml
dest: "{{ deploy_path }}"
```

---

### Bước 4: chạy test

```bash
cd ansible
ansible-playbook -i inventory.ini site.yml
```

👉 nếu không lỗi → OK

---

# 👤 QUỐC TRUNG

## ✅ TASK 1 — Thêm handler

### Bước 1: sửa file

```bash
nano ansible/roles/nginx/tasks/main.yml
```
---

Thêm dòng này vào cuối task:

```yaml
notify: restart nginx
```

---

### Bước 4: test

```bash
ansible-playbook -i inventory.ini site.yml
```

---

## ✅ TASK 2 — Test handler

Chạy 2 lần:

```bash
ansible-playbook -i inventory.ini site.yml
ansible-playbook -i inventory.ini site.yml
```

👉 lần 2 phải thấy:

```text
changed=0
```

---

## ✅ TASK 3 — Tạo vault

### Bước 1:

```bash
ansible-vault create ansible/group_vars/secrets.yml
```

---

### Bước 2: nhập password → copy nội dung

```yaml
fake_key: 123456
```

---

### Bước 3: test

```bash
ansible-playbook -i inventory.ini site.yml --ask-vault-pass
```

---

# ⚠️ LƯU Ý (RẤT QUAN TRỌNG)

## ❌ KHÔNG làm

* không xóa file
* không sửa lung tung
* không đụng CI/CD
* tạo nhánh theo cấu trúc feat/tên-job (ví dụ feat/update-handlers) rồi tạo pull request
---

## ✅ PHẢI làm

* mỗi lần sửa → chạy:

```bash
ansible-playbook -i inventory.ini site.yml
```

# 🎯 DONE KHI

* chạy không lỗi
* chạy localhost trên trình duyệt hiện website
  
