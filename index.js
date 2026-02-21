import * as fs from "node:fs"

const storage_file = './data.json'

const args = process.argv

const local_formatter = new Intl.DateTimeFormat('default', {
    year: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
})

const TaskStatus = Object.freeze({
    TODO: 'todo',
    IN_PROGRESS: 'in-progress',
    DONE: 'done'
})

function create_task(id, desc) {
    const now = new Date()
    return {
        id: id,
        description: desc,
        status: TaskStatus.TODO,
        createdAt: now,
        updatedAt: now,
    }
}

function save_tasks(tasks) {
    const json = JSON.stringify(tasks, (key, value) => {
        if(value instanceof Map) {
            return [...value]
        }

        return value
        
    }, 2)

    fs.writeFile(storage_file, json, (err) => {
        if(err) {
            console.error(`Error writing to JSON: ${err}`)
        }
    })
    
}

function get_tasks() {
    try{
        let data = fs.readFileSync(storage_file, 'utf8')
        
        let pdata = JSON.parse(data, (key, value) => {
            if(key === "map") {
                return new Map(value)
            }

            return value
        })
        return pdata
    }catch(perror) {
        if(perror.code == "ENOENT")
        {
            return null
        }else {
            console.error("Failed to parse JSON: ", perror)
            return null
        }
    }
}

if(args.length <= 2) {
    print_help()
    process.exit()
}

function print_task(task) {
    console.log(`Task (ID: ${task.id}):`)
    console.log(`  Description: ${task.description}`)
    console.log(`  Status: ${task.status}`)
    console.log(`  Created At: ${local_formatter.format(new Date(task.createdAt))}`)
    console.log(`  Updated At: ${local_formatter.format(new Date(task.updatedAt))}`)    
}

const cmd = args[2]

switch(cmd)
{
    case "add":
    {
        if(args.length <= 3) print_help()
        else {
            let tasks = get_tasks()
            if(tasks == null) tasks = { last_free: 1, map: new Map() }
            //console.log(tasks)
            const id = tasks.last_free
            tasks.last_free++
            const description = args[3]

            let task = create_task(id, description)

            tasks.map.set(id, task)
            save_tasks(tasks)

            console.log(`Task added successfully (ID: ${id})`)
        }
        break
    }
    case "delete":
    {
        if(args.length <= 3) print_help()
        else {
            let tasks = get_tasks()
            let id = parseInt(args[3])
            if(tasks == null || !tasks.map.has(id)) {
                console.error(`Task with ID ${args[3]} does not exist.`)
                process.exit(1)
            }
            tasks.map.delete(id)
            save_tasks(tasks)
                
            console.log(`Task deleted successfully (ID: ${id})`)
            
        }
        break
    }
    case "list":
    {
        let tasks = get_tasks()
        if(tasks == null || tasks.map.size == 0) {
            console.error("There is no task currently scheduled.")
            process.exit(1)
        }
        if(args.length <= 3) {

            tasks.map.forEach((value, key) => {print_task(value)})
        }
        else {
            let status = args[3]

            let filtered_tasks = [...tasks.map.values()].filter((value) => value.status === status);

            if(filtered_tasks.length == 0) {
                console.error(`There is no task with status ${status}`)
                process.exit(1)
            }

            filtered_tasks.forEach(print_task)
        }
        break
    }
    case "update":
    {
        if(args.length <= 4) print_help()
        else {
            let tasks = get_tasks()

            let id = parseInt(args[3])
            if(tasks == null || !tasks.map.has(id)) {
                console.error(`Task with ID ${args[3]} doesn't exist.`)
                process.exit(1)
            }

            let task = tasks.map.get(id)
            task.description = args[4]
            task.updatedAt = new Date()

            save_tasks(tasks)

            console.log(`Task updated successfully (ID: ${id}, Description: ${args[4]})`)
        }
        break
    }
    case "mark-in-progress":
    {
        if(args.length <= 3) print_help()
        else {
            let tasks = get_tasks()
            let id = parseInt(args[3])

            if(tasks == null || !tasks.map.has(id)) {
                console.error(`Task with ID ${args[3]} not found.`)
                process.exit(1)
            }

            let task = tasks.map.get(id)

            if(task.status == TaskStatus.IN_PROGRESS) {
                console.error(`Task with ID ${id} is already marked as being in-progress.`)
                process.exit(1)
            }

            task.status = TaskStatus.IN_PROGRESS;

            save_tasks(tasks)

            
            console.log(`Task successfully marked as done (ID: ${id})`)
        }
        break
    } 
    case "mark-done":
    {
        if(args.length <= 3) print_help()
        else {
            let tasks = get_tasks()
            let id = parseInt(args[3])

            if(tasks == null || !tasks.map.has(id)) {
                console.error(`Task with ID ${args[3]} not found.`)
                process.exit(1)
            }

            let task = tasks.map.get(id)

            if(task.status == TaskStatus.DONE) {
                console.error(`Task with ID ${id} is already marked as done.`)
                process.exit(1)
            }

            task.status = TaskStatus.DONE;

            save_tasks(tasks)

            console.log(`Task successfully marked as done (ID: ${id})`)
        }
        break
    }
    default:
    {
        print_help()
    }
}


function print_help()
{
    let help = []

    help.push("task-cli add <task-name>")
    help.push("task-cli update <id> <new-name>")
    help.push("task-cli delete <id>")
    help.push("task-cli mark-in-progress <id>")
    help.push("task-cli mark-done <id>")
    help.push("task-cli list [todo/in-progress/done]")

    help.forEach((cmd) => {
        console.log(cmd)
    })
    
}

x
